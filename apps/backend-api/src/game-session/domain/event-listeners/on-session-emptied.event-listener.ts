import {CommandBus, EventsHandler} from '@nestjs/cqrs';
import {GameSessionEmptiedEvent} from '../events/game-session-emptied.event';
import {RemoveSessionCommand} from '../commands/remove-session.command';

@EventsHandler(GameSessionEmptiedEvent)
export class OnSessionEmptiedEventListener {
    constructor(private readonly commandBus: CommandBus) {
    }

    async handle(event: GameSessionEmptiedEvent): Promise<void> {
        await this.commandBus.execute(new RemoveSessionCommand(event.gameSessionId));
    }
}
