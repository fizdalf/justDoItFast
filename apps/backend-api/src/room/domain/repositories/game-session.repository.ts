import {GameSession} from "../../../game-session/domain/entities/GameSession";

export const GameSessionRepository = 'GameSessionRepository';

export interface GameSessionRepository {
    save(gameSession: GameSession): Promise<void>;
}
