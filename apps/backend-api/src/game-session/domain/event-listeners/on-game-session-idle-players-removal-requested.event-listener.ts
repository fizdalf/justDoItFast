import {CommandBus, EventsHandler} from '@nestjs/cqrs';
import {GameSessionIdlePlayersRemovalRequestedEvent} from '../events/game-session-idle-players-removal-requested.event';
import {RemoveIdlePlayersFromGameSessionCommand} from '../commands/remove-idle-players-from-game-session.command';

@EventsHandler(GameSessionIdlePlayersRemovalRequestedEvent)
export class OnGameSessionIdlePlayersRemovalRequestedEventListener {
    constructor(private readonly commandBus: CommandBus,) {
    }

    async handle(event: GameSessionIdlePlayersRemovalRequestedEvent): Promise<void> {
        await this.commandBus.execute(new RemoveIdlePlayersFromGameSessionCommand(event.gameSessionId));
    }
}
