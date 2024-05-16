import {EventsHandler} from '@nestjs/cqrs';
import {GameSessionEmptiedEvent} from '../events/game-session-emptied.event';

@EventsHandler(GameSessionEmptiedEvent)
export class OnSessionEmptiedEventListener {
    constructor() {
    }

    async handle(event: GameSessionEmptiedEvent): Promise<void> {
        console.log(`Game session ${event.gameSessionId} emptied`);
    }
}
