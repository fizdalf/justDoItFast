import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {merge, Observable, startWith, switchMap, tap} from 'rxjs';
import {RoomService} from '../../services/room/roomService';
import {Room, Team} from '../../services/room/room';
import {WebsocketService} from '../../services/websocket/websocket.service';
import {
    PlayerJoinedRoomEvent,
    PlayerJoinedRoomEventPayload
} from '@org/core/room/websocket-events/PlayerJoinedRoomEvent';
import {PlayerLeftRoomEvent, PlayerLeftRoomEventPayload} from '@org/core/room/websocket-events/PlayerLeftRoomEvent';
import {AuthenticationService} from '../../services/authentication/authentication.service';
import {Router} from '@angular/router';

export interface Seat {
    id: string;
    playerName: string,
    teamIdx: number;
}

export interface CreateSessionPageViewModel {
    seats: Seat[];
    canStartGame: boolean;
    playerCount: number;
    sessionId: string | undefined;
    teams: Team[],
    isHost: boolean;
}

interface CreateSessionPageState {
    room: Room | undefined;
    sessionId: string | undefined;
}

function totalPlayerCount(teams: Team[] | undefined): number {
    if (!teams) {
        return 0;
    }
    return teams.reduce((acc, team) => acc + team.players.length, 0);
}

@Injectable()
export class RoomPageStore extends ComponentStore<CreateSessionPageState> {
    //// SELECTORS ////
    private sessionId$ = this.select((state) => state.room?.id);
    private playerCount$ = this.select((state) => totalPlayerCount(state.room?.teams));
    private teams$ = this.select((state) => state.room?.teams ?? []);
    private isHost$ = this.select((state) => state.room?.isHost ?? false);
    private canStartGame$ = this.select((state) => state.room !== undefined && state.room.teams[0].players.length >= 2 && state.room.teams[0].players.length === state.room.teams[1].players.length);
    //// EFFECTS ////
    public readonly fetchSession = this.effect((trigger$) =>
        trigger$.pipe(
            startWith(null),
            switchMap(() => this.sessionService.openRoom()),
            tap((session) => this.setSession(session)),
        )
    );
    private seats$ = this.select(
        this.canStartGame$,
        this.teams$,
        (canStartGame, teams) => {
            if (!canStartGame) {
                return [];
            }
            const seats: Seat[] = [];
            for (let i = 0; i < teams[0].players.length; i++) {
                const playerTeam1 = teams[0].players[i];
                const playerTeam2 = teams[1].players[i];
                seats.push({playerName: playerTeam1.name, teamIdx: 0, id: playerTeam1.id});
                seats.push({playerName: playerTeam2.name, teamIdx: 1, id: playerTeam2.id});
            }
            return seats;
        }
    );
    vm$: Observable<CreateSessionPageViewModel> = this.select(
        {
            sessionId: this.sessionId$,
            playerCount: this.playerCount$,
            teams: this.teams$,
            isHost: this.isHost$,
            canStartGame: this.canStartGame$,
            seats: this.seats$,
        }, {debounce: true});

    //// UPDATERS ////
    private readonly setSession = this.updater((state, session: Room): CreateSessionPageState => {
        return {
            ...state,
            room: session,
        };
    });

    private readonly listenSessionChanges = this.effect(() => {
            return merge(
                this.websocketService.on<PlayerJoinedRoomEventPayload>(PlayerJoinedRoomEvent.eventName()),
                this.websocketService.on<PlayerLeftRoomEventPayload>(PlayerLeftRoomEvent.eventName())
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

