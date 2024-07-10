import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {merge, Observable, startWith, switchMap, tap} from 'rxjs';
import {RoomService} from '../../services/room/roomService';
import {WebsocketService} from '../../services/websocket/websocket.service';
import {
    UserJoinedRoomWebsocketEvent,
    UserJoinedRoomWebsocketEventPayload
} from '@org/core/room/websocket-events/UserJoinedRoomWebsocketEvent';
import {
    UserLeftRoomEventWebsocketPayload,
    UserLeftRoomWebsocketEvent
} from '@org/core/room/websocket-events/UserLeftRoomWebsocketEvent';
import {AuthenticationService} from '../../services/authentication/authentication.service';
import {Router} from '@angular/router';
import {CurrentRoomDto} from "@org/core/room/dto/current-room.dto";
import {
    CreatedGameWebsocketEvent,
    CreatedGameWebsocketEventPayload
} from "@org/core/room/websocket-events/CreatedGameWebsocketEvent";

export interface Seat {
    id: string;
    playerName: string,
    teamIdx: number;
}

export interface CreateSessionPageViewModel {
    canStartGame: boolean;
    playerCount: number;
    sessionId: string | undefined;
    isHost: boolean;
    users: { id: string, name: string }[];
}

interface CreateSessionPageState {
    room: CurrentRoomDto | undefined;
    sessionId: string | undefined;
}

@Injectable()
export class RoomPageStore extends ComponentStore<CreateSessionPageState> {
    //// SELECTORS ////
    private sessionId$ = this.select((state) => state.room?.id);
    private playerCount$ = this.select((state) => state.room?.users.length || 0);
    private isHost$ = this.select((state) => state.room?.isHost ?? false);
    private canStartGame$ = this.select((state) => state.room !== undefined && state.room.users.length >= 4);
    private users$ = this.select((state) => state.room ? state.room.users : []);
    //// EFFECTS ////
    public readonly fetchSession = this.effect((trigger$) =>
        trigger$.pipe(
            startWith(null),
            switchMap(() => this.sessionService.openRoom()),
            tap((session) => this.setSession(session)),
        )
    );

    vm$: Observable<CreateSessionPageViewModel> = this.select(
        {
            sessionId: this.sessionId$,
            playerCount: this.playerCount$,
            isHost: this.isHost$,
            canStartGame: this.canStartGame$,
            users: this.users$
        }, {debounce: true});

    //// UPDATERS ////
    private readonly setSession = this.updater((state, session: CurrentRoomDto): CreateSessionPageState => {
        return {
            ...state,
            room: session,
        };
    });

    private readonly listenSessionChanges = this.effect(() => {
            return merge(
                this.websocketService.on<UserJoinedRoomWebsocketEventPayload>(UserJoinedRoomWebsocketEvent.eventName()),
                this.websocketService.on<UserLeftRoomEventWebsocketPayload>(UserLeftRoomWebsocketEvent.eventName())
            )
                .pipe(
                    tap((events) => {
                        console.log('events', events);
                        this.fetchSession();
                    })
                );
        }
    );

    private readonly onGameCreated = this.effect(() => {
        return this.websocketService.on<CreatedGameWebsocketEventPayload>(CreatedGameWebsocketEvent.eventName())
            .pipe(
                tap(() => {
                    console.log('game created ...it should navigate somewhere')
                }),
                tap(() => this.router.navigate(['/game']))
            )
    })

    constructor(
        private readonly sessionService: RoomService,
        private readonly websocketService: WebsocketService,
        private readonly authenticationService: AuthenticationService,
        private readonly router: Router,
    ) {
        super({sessionId: undefined, room: undefined});
    }

    async leaveRoom() {
        await this.sessionService.leaveRoom();
        this.authenticationService.logout();
        this.router.navigate(['/']);
    }

    async createGame() {
        await this.sessionService.createGame()
    }
}

