import {GameSessionPlayerJoinedEvent} from '../../domain/events/game-session-player-joined.event';
import {EventsHandler, IEventHandler} from '@nestjs/cqrs';
import {GameSessionSocketGateway} from './game-session-socket-gateway';

@EventsHandler(GameSessionPlayerJoinedEvent)
export class OnGameSessionJoinedEventHandler implements IEventHandler<GameSessionPlayerJoinedEvent> {
    constructor(private gameSessionSocketGateway: GameSessionSocketGateway) {
    }

    async handle(event: GameSessionPlayerJoinedEvent): Promise<void> {
        console.log('should inform about player joined', event);
        await this.gameSessionSocketGateway.informPlayerJoined(event.gameSessionId, event.playerName);
    }

}
