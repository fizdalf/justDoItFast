import {InjectionToken} from "@angular/core";
import {GameWaitingRoomDto} from "@org/core/game/dto/game-waiting-room.dto";


export const GameService = new InjectionToken('GameService');

export interface GameService {
    getGameWaitingRoom(): Promise<GameWaitingRoomDto>;
}