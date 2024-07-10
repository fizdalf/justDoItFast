import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {merge, Observable, startWith, switchMap, tap} from 'rxjs';
import {RoomService} from '../../services/room/roomService';
import {WebsocketService} from '../../services/websocket/websocket.service';
import {UserJoinedRoomEvent, UserJoinedRoomEventPayload} from '@org/core/room/websocket-events/UserJoinedRoomEvent';
import {UserLeftRoomEvent, UserLeftRoomEventPayload} from '@org/core/room/websocket-events/UserLeftRoomEvent';
import {AuthenticationService} from '../../services/authentication/authentication.service';
import {Router} from '@angular/router';
import {CurrentRoomDto} from "@org/core/room/dto/current-room.dto";

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
                this.websocketService.on<UserJoinedRoomEventPayload>(UserJoinedRoomEvent.eventName()),
                this.websocketService.on<UserLeftRoomEventPayload>(UserLeftRoomEvent.eventName())
            )
                .pipe(
                    tap((events) => {
                        console.log('events', events);
                        this.fetchSession();
                    })
                );
        }
    );

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
}

