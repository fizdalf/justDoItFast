import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {GameSessionService} from '../../services/game-session/gameSessionService';
import {ActivatedRoute} from '@angular/router';

import {tap, withLatestFrom} from 'rxjs';
import {IdentityService} from '../../services/identity-service/identity.service';
import {GameSession} from '../../services/game-session/gameSession';


interface SessionJoinWaitingRoomPageState {
    session: GameSession | undefined;
    identity: string | undefined;
}

@Injectable()
export class SessionJoinWaitingRoomPageStore extends ComponentStore<SessionJoinWaitingRoomPageState> {

    constructor(
        private readonly activatedRoute: ActivatedRoute,
        private readonly sessionService: GameSessionService,
        private readonly identityService: IdentityService
    ) {
        super({
            session: undefined,
            identity: undefined
        });
    }

    //// Selectors ////
    readonly identity$ = this.select(state => state.identity);
    readonly session$ = this.select(state => state.session);
    //// Updaters ////


    //// Effects ////


    public readonly leaveSession = this.effect((trigger$) => {
        return trigger$.pipe(
            withLatestFrom(this.session$, this.identity$),
            tap(([_, session, identity]) => {
                if (!session || !identity) {
                    return;
                }
                this.sessionService.leaveSession(session.id, identity);
            })
        );
    })
}
