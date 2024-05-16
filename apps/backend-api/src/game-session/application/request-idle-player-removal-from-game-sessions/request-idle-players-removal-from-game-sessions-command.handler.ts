import {
    RequestIdlePlayersRemovalFromGameSessionsCommand
} from '../../domain/commands/request-idle-players-removal-from-game-sessions.command';
import {CommandHandler, EventBus, ICommandHandler, IEventBus} from '@nestjs/cqrs';
import {Inject} from '@nestjs/common';
import {
    GameSessionIdlePlayersRemovalRequestedEvent
} from '../../domain/events/game-session-idle-players-removal-requested.event';
import {GameSessionsIdsGetter} from '../../domain/service/GameSessionsIdsGetter';

@CommandHandler(RequestIdlePlayersRemovalFromGameSessionsCommand)
export class RequestIdlePlayersRemovalFromGameSessionsCommandHandler implements ICommandHandler<RequestIdlePlayersRemovalFromGameSessionsCommand> {
    constructor(
        @Inject(GameSessionsIdsGetter) private readonly gameSessionIdsGetter: GameSessionsIdsGetter,
        @Inject(EventBus) private readonly eventBus: IEventBus,
    ) {
    }

    async execute(_command: RequestIdlePlayersRemovalFromGameSessionsCommand): Promise<void> {
        const gameSessionIds = await this.gameSessionIdsGetter.getGameSessionsIds();

        gameSessionIds.forEach(gameSessionId => {
            this.eventBus.publish(new GameSessionIdlePlayersRemovalRequestedEvent(gameSessionId.value));
        });
    }
}
