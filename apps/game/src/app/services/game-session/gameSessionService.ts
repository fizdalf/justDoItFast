import {Observable} from 'rxjs';
import {InjectionToken} from '@angular/core';
import {GameSession} from './gameSession';
import {GameSessionPreview} from '@org/core/game-session/dto/gameSessionPreview';


export const GameSessionService = new InjectionToken('GameSessionService');

export interface GameSessionService {
    createSession(playerName: string): Promise<string>;

    onSessionUpdated(sessionId: string): Observable<GameSession>;

    openSession(): Promise<GameSession>;

    joinSession(sessionId: string, playerName: string): Promise<string>;

    leaveSession(): Promise<void>;

    getSessionPreview(sessionId: string): Promise<GameSessionPreview>;
}
