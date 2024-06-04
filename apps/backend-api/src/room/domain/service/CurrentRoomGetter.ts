import {RoomId} from '../valueObjects/RoomId';
import {UserId} from '../valueObjects/UserId';

export const CurrentRoomGetter = Symbol('CurrentRoomGetter');

export interface CurrentRoom {
    id: string;
    host: string;
    isHost: boolean;
    createdAt: Date;
    updatedAt: Date;
    gameSessionId: string|null;
    teams: {
        id: string;
        players: {
            id: string;
            name: string;
        }[];
    }[];
}

export interface CurrentRoomGetter {
    execute(roomId: RoomId, playerId: UserId): Promise<CurrentRoom>;
}
