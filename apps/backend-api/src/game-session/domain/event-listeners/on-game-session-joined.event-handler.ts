import {GameSessionPlayerJoinedEvent} from '../events/game-session-player-joined.event';
import {EventsHandler, IEventHandler} from '@nestjs/cqrs';
import {GameSessionSocketGateway} from '../../infrastructure/websocket/game-session-socket-gateway';

@EventsHandler(GameSessionPlayerJoinedEvent)
export class OnGameSessionJoinedEventHandler implements IEventHandler<GameSessionPlayerJoinedEvent> {
    constructor(private gameSessionSocketGateway: GameSessionSocketGateway) {
    }

    async handle(event: GameSessionPlayerJoinedEvent): Promise<void> {
        await this.gameSessionSocketGateway.informPlayerJoined(event.gameSessionId, event.playerName);
    }

}
