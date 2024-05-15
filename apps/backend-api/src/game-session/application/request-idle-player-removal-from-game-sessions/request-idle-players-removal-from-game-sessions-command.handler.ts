import {
    RequestIdlePlayersRemovalFromGameSessionsCommand
} from '../../domain/commands/request-idle-players-removal-from-game-sessions.command';
import {EventBus, ICommandHandler, IEventBus} from '@nestjs/cqrs';
import {Inject} from '@nestjs/common';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {
    GameSessionIdlePlayersRemovalRequestedEvent
} from '../../domain/events/game-session-idle-players-removal-requested.event';


interface GameSessionsIdGetter {
    getGameSessionsId(): Promise<GameSessionId[]>;
}

export class RequestIdlePlayersRemovalFromGameSessionsCommandHandler implements ICommandHandler<RequestIdlePlayersRemovalFromGameSessionsCommand> {
    constructor(
        private readonly gameSessionIdsGetter: GameSessionsIdGetter,
        @Inject(EventBus) private readonly eventBus: IEventBus,
    ) {
    }

    async execute(command: RequestIdlePlayersRemovalFromGameSessionsCommand): Promise<void> {
        const gameSessionIds = await this.gameSessionIdsGetter.getGameSessionsId();

        gameSessionIds.forEach(gameSessionId => {
            this.eventBus.publish(new GameSessionIdlePlayersRemovalRequestedEvent(gameSessionId.value));
        });
    }
}
