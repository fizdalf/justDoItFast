import {Inject, Injectable} from "@angular/core";
import {ComponentStore} from "@ngrx/component-store";
import {GameWaitingRoomDto} from "@org/core/game/dto/game-waiting-room.dto";
import {of, switchMap, tap} from "rxjs";
import {GameService} from "../../services/game/game.service";

export interface GameHomePageState {
    gameWaitingRoom: GameWaitingRoomDto | undefined;

}

export interface GameHomePageViewModel {
    isHost: boolean;
    seats: { id: string, playerName: string }[];
}

@Injectable()
export class GameHomePageStore extends ComponentStore<GameHomePageState> {

    /// Selectors ///
    private readonly gameWaitingRoom = this.select(state => state.gameWaitingRoom);
    private readonly isHost$ = this.select(state => state.gameWaitingRoom?.isHost ?? false);
    private readonly seats$ = this.select(state => {
        const gameWaitingRoom = state.gameWaitingRoom;
        if (!gameWaitingRoom) return [];
        const seats = gameWaitingRoom.seats;

        return seats.sort((a, b) => a.index - b.index).map(seat => {
            const foundUser = gameWaitingRoom.users.find(user => user.id === seat.userId);
            return {
                id: seat.userId,
                playerName: foundUser?.name || 'Unknown',
            };

        });
    });
    public readonly vm$ = this.select(
        this.isHost$,
        this.seats$,
        (isHost, seats) => {
            return {
                isHost: isHost,
                seats,
            };
        }
    );
    /// Updaters ///
    private setGameWaitingRoom = this.updater((state, gameWaitingRoomDto: GameWaitingRoomDto) => {
        return {
            ...state,
            gameWaitingRoom: gameWaitingRoomDto,
        };
    });
    /// Effects ///
    public readonly loadGamePreviewRoom = this.effect<string>(() => {
        return of(1).pipe(
            switchMap(() => this.gameService.getGameWaitingRoom()),
            tap((gameWaitingRoom) => this.setGameWaitingRoom(gameWaitingRoom))
        );
    });

    constructor(@Inject(GameService) private gameService: GameService) {
        super({
            gameWaitingRoom: undefined,
        });
    }

}