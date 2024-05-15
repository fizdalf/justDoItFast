import {GameSession} from '../aggregateRoots/GameSession';
import {GameSessionId} from '../valueObjects/GameSessionId';

export const GameSessionRepository = Symbol('GameSessionRepository');

export interface GameSessionRepository {
    save(gameSession: GameSession): Promise<void>
    findOneById(id: GameSessionId): Promise<GameSession>
}
