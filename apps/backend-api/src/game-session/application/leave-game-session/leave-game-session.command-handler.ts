import {CommandHandler, EventBus, ICommandHandler, IEventBus} from '@nestjs/cqrs';
import {LeaveGameSessionCommand} from '../../domain/commands/leave-game-session.command';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {Inject} from '@nestjs/common';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {PlayerId} from '../../domain/valueObjects/PlayerId';

@CommandHandler(LeaveGameSessionCommand)
export class LeaveGameSessionCommandHandler implements ICommandHandler<LeaveGameSessionCommand> {

    constructor(
        @Inject(GameSessionRepository) private readonly gameSessionRepository: GameSessionRepository,
        @Inject(EventBus) private readonly eventBus: IEventBus
    ) {

    }

    async execute(command: LeaveGameSessionCommand): Promise<void> {
        const gameSession = await this.gameSessionRepository.findOneById(GameSessionId.fromValue(command.gameSessionId));

        gameSession.leave(PlayerId.fromValue(command.playerId));

        await this.gameSessionRepository.save(gameSession);
        this.eventBus.publishAll(gameSession.getUncommittedEvents());
    }
}
