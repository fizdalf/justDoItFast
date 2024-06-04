import {GameSession} from "../aggregateRoots/GameSession";

export const GameSessionRepository = 'GameSessionRepository';

export interface GameSessionRepository {
    save(gameSession: GameSession): Promise<void>;
}
