import {RegisterPlayerContactCommand} from '../../domain/commands/register-player-contact.command';
import {CommandHandler, EventBus, ICommandHandler, IEventBus} from '@nestjs/cqrs';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {Inject} from '@nestjs/common';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {PlayerId} from '../../domain/valueObjects/PlayerId';

@CommandHandler(RegisterPlayerContactCommand)
export class RegisterPlayerContactCommandHandler implements ICommandHandler<RegisterPlayerContactCommand> {

    constructor(
        @Inject(GameSessionRepository) private readonly gameSessionRepository: GameSessionRepository,
        @Inject(EventBus) private eventBus: IEventBus
    ) {
    }

    async execute(command: RegisterPlayerContactCommand): Promise<void> {
        const gameSession = await this.gameSessionRepository.findOneById(GameSessionId.fromValue(command.sessionId));
        gameSession.registerPlayerContact(PlayerId.fromValue(command.playerId));
        await this.gameSessionRepository.save(gameSession);
        this.eventBus.publishAll(gameSession.getUncommittedEvents());
    }
}
