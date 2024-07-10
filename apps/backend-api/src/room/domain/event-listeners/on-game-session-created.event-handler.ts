import {EventsHandler, IEventHandler} from '@nestjs/cqrs';
import {RoomSocketGateway} from '../../infrastructure/websocket/room-socket-gateway.service';
import {GameSessionCreatedEvent} from "../../../game-session/domain/events/game-session-created.event";

@EventsHandler(GameSessionCreatedEvent)
export class OnGameSessionCreatedEventHandler implements IEventHandler<GameSessionCreatedEvent> {
    constructor(private roomSocketGateway: RoomSocketGateway) {
    }

    async handle(event: GameSessionCreatedEvent): Promise<void> {
        await this.roomSocketGateway.informGameSessionCreated({roomId: event.roomId, gameSessionId: event.aggregateId});
    }

}
