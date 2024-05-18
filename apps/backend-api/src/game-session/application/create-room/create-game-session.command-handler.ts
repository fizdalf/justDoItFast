import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {CreateGameSession} from '../../domain/commands/create-game-session.command';
import {GameSession} from '../../domain/aggregateRoots/GameSession';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {Inject} from '@nestjs/common';


@CommandHandler(CreateGameSession)
export class CreateGameSessionCommandHandler implements ICommandHandler<CreateGameSession> {
    constructor(@Inject(GameSessionRepository) private gameSessionRepository: GameSessionRepository) {
    }

    async execute(command: CreateGameSession) {
        const session = GameSession.create(command.params.host, command.params.gameSessionId);
        await this.gameSessionRepository.save(session);



    }
}
