import {RoomId} from '../valueObjects/RoomId';
import {PlayerId} from '../valueObjects/PlayerId';

export const CurrentRoomGetter = Symbol('CurrentRoomGetter');

export interface CurrentRoom {
    id: string;
    host: string;
    isHost: boolean;
    createdAt: Date;
    updatedAt: Date;
    teams: {
        id: string;
        players: {
            id: string;
            name: string;
        }[];
    }[];
}

export interface CurrentRoomGetter {
    execute(roomId: RoomId, playerId: PlayerId): Promise<CurrentRoom>;
}
