import {ICommand} from '@nestjs/cqrs';

export class JoinGameSessionCommand implements ICommand {
    constructor(
        public readonly sessionId: string,
        public readonly playerId: string,
        public readonly playerName: string
    ) {
    }
}
