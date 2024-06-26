import {firstValueFrom} from 'rxjs';
import {RoomService} from './roomService';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Room} from './room';
import {RoomPreviewDto} from '@org/core/room/dto/room-preview.dto';


@Injectable()
export class ImpRoomService implements RoomService {
    constructor(private client: HttpClient) {

    }

    async createRoom(playerName: string): Promise<string> {
        const response = await firstValueFrom(this.client.post<{
            success: boolean,
            token: string
        }>(`/api/room`, {hostPlayerName: playerName}));
        return response.token;
    }


    async openRoom(): Promise<Room> {
        const response = await firstValueFrom(
            this.client.get('/api/room', {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('roomToken')}`
                }
            })
        );
        return rehydrateRoom(response);
    }

    async joinRoom(sessionId: string, playerName: string): Promise<string> {
        const response = await firstValueFrom(this.client.post<{
            success: boolean,
            token: string
        }>(`/api/room/${sessionId}/join`, {playerName}));
        return response.token;
    }

    async leaveRoom(): Promise<void> {
        await firstValueFrom(this.client.post(
            '/api/room/leave',
            {},
            {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('roomToken')}`
                }
            }
        ));
    }

    async getRoomPreview(sessionId: string): Promise<RoomPreviewDto> {
        return await firstValueFrom(this.client.get<RoomPreviewDto>(`/api/room/${sessionId}/preview`));
    }


}


function rehydrateRoom(data: any): Room {
    return {
        id: data.id,
        teams: data.teams.map((team: any) => ({
            id: team.id,
            players: team.players.map((player: any) => ({
                id: player.id,
                name: player.name,
            }))
        })),
        host: data.host,
        isHost: data.isHost,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
    };
}
