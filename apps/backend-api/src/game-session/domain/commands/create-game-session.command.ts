import {GameSessionId} from '../valueObjects/GameSessionId';
import {Player} from '../entities/Player';
import {Command} from '../../../shared/domain/command';

export interface CreateGameSessionParams {
    gameSessionId: GameSessionId;
    host: Player
}

export class CreateGameSession implements Command {
    constructor(public readonly params: CreateGameSessionParams) {
    }
}
