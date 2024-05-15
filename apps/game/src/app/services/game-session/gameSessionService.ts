import {Observable} from 'rxjs';
import {InjectionToken} from '@angular/core';
import {GameSession, GameSessionPreview} from './gameSession';


export const GameSessionService = new InjectionToken('GameSessionService');

export interface GameSessionService {
    createSession(playerName: string): Promise<string>;

    onSessionUpdated(sessionId: string): Observable<GameSession>;

    openSession(): Promise<GameSession>;

    joinSession(sessionId: string, playerName: string): Promise<void>;

    leaveSession(id: string, playerId: string): Promise<void>;

    getSessionPreview(sessionId: string): Promise<GameSessionPreview>;
}
