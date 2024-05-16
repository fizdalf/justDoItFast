import {CommandHandler, ICommandHandler, IEventBus} from '@nestjs/cqrs';
import {RemoveSessionCommand} from '../../domain/commands/remove-session.command';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {Inject} from '@nestjs/common';
import {GameSessionRemovedDomainEvent} from '../../domain/events/game-session-removed.event';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';

@CommandHandler(RemoveSessionCommand)
export class RemoveSessionCommandHandler implements ICommandHandler<RemoveSessionCommand> {

    constructor(
        @Inject(GameSessionRepository) private repository: GameSessionRepository,
        @Inject('EventBus') private eventBus: IEventBus,
    ) {
    }

    async execute(command: RemoveSessionCommand): Promise<void> {
        await this.repository.remove(GameSessionId.fromValue(command.sessionId));
        this.eventBus.publish(new GameSessionRemovedDomainEvent(command.sessionId));
    }
}
