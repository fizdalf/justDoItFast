import {InjectionToken} from '@angular/core';
import {RoomPreviewDto} from '@org/core/room/dto/room-preview.dto';
import {CurrentRoomDto} from "@org/core/room/dto/current-room.dto";


export const RoomService = new InjectionToken('RoomService');

export interface RoomService {
    createRoom(playerName: string): Promise<string>;

    openRoom(): Promise<CurrentRoomDto>;

    joinRoom(roomId: string, username: string): Promise<string>;

    leaveRoom(): Promise<void>;

    getRoomPreview(roomId: string): Promise<RoomPreviewDto>;

    createGame(): Promise<void>;
}
