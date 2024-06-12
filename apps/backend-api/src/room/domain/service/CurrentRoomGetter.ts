import {RoomId} from '../value-objects/RoomId';
import {UserId} from '../value-objects/UserId';
import {CurrentRoomDto} from "@org/core/room/dto/current-room.dto";

export const CurrentRoomGetter = Symbol('CurrentRoomGetter');

export interface CurrentRoomGetter {
    execute(roomId: RoomId, playerId: UserId): Promise<CurrentRoomDto>;
}
