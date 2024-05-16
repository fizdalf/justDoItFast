import {CommandHandler, EventBus, ICommandHandler, IEventBus} from '@nestjs/cqrs';
import {
    RemoveIdlePlayersFromGameSessionCommand
} from '../../domain/commands/remove-idle-players-from-game-session.command';
import {Inject} from '@nestjs/common';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';

@CommandHandler(RemoveIdlePlayersFromGameSessionCommand)
export class RemoveIdlePlayersFromGameSessionCommandHandler implements ICommandHandler<RemoveIdlePlayersFromGameSessionCommand> {
    constructor(
        @Inject(GameSessionRepository) private readonly gameSessionRepository: GameSessionRepository,
        @Inject(EventBus) private readonly eventBus: IEventBus,
    ) {
    }

    async execute(command: RemoveIdlePlayersFromGameSessionCommand): Promise<void> {
        const gameSession = await this.gameSessionRepository.findOneById(GameSessionId.fromValue(command.gameSessionId));
        gameSession.removeIdlePlayers();
        await this.gameSessionRepository.save(gameSession);

        this.eventBus.publishAll(gameSession.getUncommittedEvents());
    }
}
