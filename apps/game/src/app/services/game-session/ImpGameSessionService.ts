import {firstValueFrom, Observable} from 'rxjs';
import {GameSessionService} from './gameSessionService';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {GameSession} from './gameSession';
import {WebsocketService} from '../websocket/websocket.service';
import {GameSessionPreview} from '@org/core/game-session/dto/gameSessionPreview';


@Injectable()
export class ImpGameSessionService implements GameSessionService {
    constructor(private client: HttpClient, private socketService: WebsocketService) {
        this.client.get('/api').subscribe((response) => {
            console.log(response);
        });
    }

    async createSession(playerName: string): Promise<string> {
        const response = await firstValueFrom(this.client.post<{
            success: boolean,
            token: string
        }>(`/api/game-session`, {hostPlayerName: playerName}));
        return response.token;
    }

    onSessionUpdated(sessionId: string): Observable<GameSession> {
        throw new Error('Method not implemented.');
    }

    async openSession(): Promise<GameSession> {
        const response = await firstValueFrom(
            this.client.get('/api/game-session', {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('gameSessionToken')}`
                }
            })
        );

        await this.socketService.emit('login', sessionStorage.getItem('gameSessionToken'));
        return rehydrateGameSession(response);
    }

    async joinSession(sessionId: string, playerName: string): Promise<string> {
        const response = await firstValueFrom(this.client.post<{
            success: boolean,
            token: string
        }>(`/api/game-session/${sessionId}/join`, {playerName}));
        return response.token;
    }

    leaveSession(id: string, playerId: string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    async getSessionPreview(sessionId: string): Promise<GameSessionPreview> {
        return await firstValueFrom(this.client.get<GameSessionPreview>(`/api/game-session-preview/${sessionId}`));
    }


}


function rehydrateGameSession(data: any): GameSession {
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
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
    };
}
