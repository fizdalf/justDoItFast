import {RoomPlayerJoinedEvent} from '../events/room-player-joined.event';
import {EventsHandler, IEventHandler} from '@nestjs/cqrs';
import {RoomSocketGateway} from '../../infrastructure/websocket/room-socket-gateway.service';

@EventsHandler(RoomPlayerJoinedEvent)
export class OnRoomJoinedEventHandler implements IEventHandler<RoomPlayerJoinedEvent> {
    constructor(private roomSocketGateway: RoomSocketGateway) {
    }

    async handle(event: RoomPlayerJoinedEvent): Promise<void> {
        await this.roomSocketGateway.informPlayerJoined(event.roomId, event.playerName);
    }

}
