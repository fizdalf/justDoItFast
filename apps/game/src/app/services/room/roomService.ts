import {InjectionToken} from '@angular/core';
import {Room} from './room';
import {RoomPreviewDto} from '@org/core/room/dto/room-preview.dto';


export const RoomService = new InjectionToken('RoomService');

export interface RoomService {
    createRoom(playerName: string): Promise<string>;

    openRoom(): Promise<Room>;

    joinRoom(roomId: string, playerName: string): Promise<string>;

    leaveRoom(): Promise<void>;

    getRoomPreview(roomId: string): Promise<RoomPreviewDto>;
}
