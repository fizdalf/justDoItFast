import {GameWaitingRoomDto} from "@org/core/game/dto/game-waiting-room.dto";
import {RoomId} from "../../../room/domain/value-objects/RoomId";
import {UserId} from "../../../room/domain/value-objects/UserId";

export const GameWaitingRoomGetter = Symbol('GameWaitingRoomGetter');

export interface GameWaitingRoomGetter {
    execute(roomId: RoomId, userId: UserId): Promise<GameWaitingRoomDto>;
}