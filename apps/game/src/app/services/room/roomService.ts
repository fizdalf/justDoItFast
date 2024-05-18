import {InjectionToken} from '@angular/core';
import {Room} from './room';
import {RoomPreview} from '@org/core/room/dto/roomPreview';


export const RoomService = new InjectionToken('RoomService');

export interface RoomService {
    createRoom(playerName: string): Promise<string>;

    openRoom(): Promise<Room>;

    joinRoom(roomId: string, playerName: string): Promise<string>;

    leaveRoom(): Promise<void>;

    getRoomPreview(roomId: string): Promise<RoomPreview>;
}
