import {Icon} from './icon';
import {uuidv7} from 'uuidv7';
import {filter, map, Observable, Subject} from 'rxjs';
import {GameSession, IsHost, Player, SessionService, TeamId} from './session.service';
import {SessionEvent} from './events/session.event';
import {SessionCreatedEvent} from './events/session-created.event';
import {EventFactory} from './events/event.factory';
import {SessionId} from './SessionId';
import {SessionUpdatedEvent} from './sessionUpdatedEvent';
import {PlayerId} from './player.id';
import {GameSessionRepository} from '../../domain/GameSessionRepository';
import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class SameBrowserSessionService implements SessionService {
    private sessionEventSubject = new Subject<SessionEvent>();

    private broadcastChannel: BroadcastChannel;

    constructor(private gameSessionRepository: GameSessionRepository) {
        this.broadcastChannel = new BroadcastChannel("session_channel");
        this.broadcastChannel.onmessage = (ev) => {
            console.log(ev);
            const eventData = ev.data;

            if (!("type" in eventData)) {
                return;
            }
            const sessionEvent = EventFactory.fromRawEvent(eventData as SessionEvent);
            this.sessionEventSubject.next(sessionEvent);

        };
    }

    retrieveSession(id: SessionId): Promise<GameSession> {
        return this.gameSessionRepository.ofId(id);
    }

    async createSession(selectedIcon: Icon): Promise<SessionId> {
        let uuid = uuidv7();
        let sessionId: SessionId = new SessionId(uuid);


        const newSession: GameSession = new GameSession(
            {
                id: sessionId,
                players: [
                    new Player(
                        {
                            id: new PlayerId(uuidv7()),
                            icon: selectedIcon,
                            teamId: new TeamId(uuidv7()),
                            isHost: new IsHost(true)
                        }
                    )
                ]
            }
        )
        await this.gameSessionRepository.save(newSession);
        this.broadcastChannel.postMessage(
            new SessionCreatedEvent(sessionId, selectedIcon).toPrimitives()
        );
        return sessionId;
    }

    onSessionUpdated(sessionId: SessionId): Observable<SessionUpdatedEvent> {
        return this.sessionEventSubject.asObservable().pipe(
            filter((event) => event.sessionId.value === sessionId.value),
            map((event) => {
                return {
                    sessionId: sessionId.value,
                };
            })
        );
    }
}
