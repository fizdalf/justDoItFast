
import {firstValueFrom, Observable} from 'rxjs';
import {GameSessionService} from './gameSessionService';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {GameSession} from './gameSession';

@Injectable()
export class ImpGameSessionService implements GameSessionService {
    constructor(private client: HttpClient) {
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

        return rehydrateGameSession(response);
    }

    joinSession(sessionId: string, playerName:string): Promise<void> {
        throw new Error('Method not implemented.');
    }

    leaveSession(id: string, playerId: string): Promise<void> {
        throw new Error('Method not implemented.');
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
