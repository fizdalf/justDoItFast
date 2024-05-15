import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {combineLatest, Observable, startWith, switchMap, tap} from 'rxjs';
import {GameSessionService} from '../../services/game-session/gameSessionService';
import {GameSession, Team} from '../../services/game-session/gameSession';
import {WebsocketService} from '../../services/websocket/websocket.service';
import {
    PlayerJoinedGameSessionEvent,
    PlayerJoinedGameSessionEventPayload
} from '@org/core/game-session/websocket-events/PlayerJoinedGameSessionEvent';
import {
    LoginWebsocketEvent,
    LoginWebsocketEventPayload
} from '@org/core/game-session/websocket-events/LoginWebsocketEvent';

export interface CreateSessionPageViewModel {
    playerCount: number;
    sessionId: string | undefined;
    teams: Team[]
}

interface CreateSessionPageState {
    session: GameSession | undefined;
    sessionId: string | undefined;
}

function totalPlayerCount(teams: Team[] | undefined): number {
    if (!teams) {
        return 0;
    }
    return teams.reduce((acc, team) => acc + team.players.length, 0);
}

@Injectable()
export class CreateSessionPageStore extends ComponentStore<CreateSessionPageState> {
    private readonly logInWebSocket = this.effect((trigger$) =>
        combineLatest([
            trigger$,
            this.websocketService.on('connect').pipe(
                tap(() => {
                    console.log('connected again?')
                }),
                startWith(undefined),
            )
        ]).pipe(
            tap(() => {
                console.log('trying to login in websocket');
                this.websocketService.emit<LoginWebsocketEventPayload>(LoginWebsocketEvent.eventName(), {token: sessionStorage.getItem('gameSessionToken') ?? ''});
            })
        )
    );

    //// SELECTORS ////

    private sessionId$ = this.select((state) => state.session?.id);
    private playerCount$ = this.select((state) => totalPlayerCount(state.session?.teams));
    private teams$ = this.select((state) => state.session?.teams ?? []);

    vm$: Observable<CreateSessionPageViewModel> = this.select(
        {
            sessionId: this.sessionId$,
            playerCount: this.playerCount$,
            teams: this.teams$,
        }, {debounce: true});

    //// UPDATERS ////
    private readonly setSession = this.updater((state, session: GameSession): CreateSessionPageState => {
        return {
            ...state,
            session,
        };
    });
    //// EFFECTS ////
    public readonly fetchSession = this.effect((trigger$) =>
        trigger$.pipe(
            switchMap(() => this.sessionService.openSession()),
            tap((session) => {
                this.logInWebSocket();
                this.setSession(session);
            }),
        )
    );
    private readonly onSessionJoin = this.effect(() => {
            return this.websocketService.on<PlayerJoinedGameSessionEventPayload>(PlayerJoinedGameSessionEvent.eventName())
                .pipe(
                    tap(({playerName}) => this.fetchSession())
                );
        }
    );

    constructor(
        private readonly sessionService: GameSessionService,
        private readonly websocketService: WebsocketService,
    ) {
        super({sessionId: undefined, session: undefined});
    }
}

