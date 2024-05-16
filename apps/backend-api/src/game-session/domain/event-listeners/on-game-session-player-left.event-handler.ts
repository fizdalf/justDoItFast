import {GameSessionPlayerLeftEvent} from '../events/game-session-player-left.event';
import {EventsHandler, IEventHandler} from '@nestjs/cqrs';
import {GameSessionSocketGateway} from '../../infrastructure/websocket/game-session-socket-gateway';

@EventsHandler(GameSessionPlayerLeftEvent)
export class OnGameSessionPlayerLeftEventHandler implements IEventHandler<GameSessionPlayerLeftEvent> {
    constructor(private gameSessionSocketGateway: GameSessionSocketGateway) {
    }

    async handle(event: GameSessionPlayerLeftEvent): Promise<void> {
        await this.gameSessionSocketGateway.informPlayerLeft(event.gameSessionId, event.playerId);
    }

}
