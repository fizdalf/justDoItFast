import {GameSessionPlayerJoinedEvent} from '../../domain/events/game-session-player-joined.event';
import {IEventHandler} from '@nestjs/cqrs';
import {GameSessionSocketGateway} from './game-session-socket-gateway';


export class OnGameSessionJoinedEventHandler implements IEventHandler<GameSessionPlayerJoinedEvent> {
    constructor(private gameSessionSocketGateway: GameSessionSocketGateway) {
    }

    async handle(event: GameSessionPlayerJoinedEvent): Promise<void> {
        await this.gameSessionSocketGateway.informPlayerJoined(event.gameSessionId, event.playerName);
    }

}
