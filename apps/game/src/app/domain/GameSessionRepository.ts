import {SessionId} from '../services/game-session/SessionId';
import {GameSession} from '../services/game-session/session.service';

export abstract class GameSessionRepository {
    abstract ofId(id: SessionId): Promise<GameSession>;
    abstract save(session: GameSession): Promise<void>;
}
