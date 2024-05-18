import {RoomPlayerLeftEvent} from '../events/room-player-left.event';
import {EventsHandler, IEventHandler} from '@nestjs/cqrs';
import {RoomSocketGateway} from '../../infrastructure/websocket/room-socket-gateway.service';

@EventsHandler(RoomPlayerLeftEvent)
export class OnRoomPlayerLeftEventHandler implements IEventHandler<RoomPlayerLeftEvent> {
    constructor(private roomSocketGateway: RoomSocketGateway) {
    }

    async handle(event: RoomPlayerLeftEvent): Promise<void> {
        await this.roomSocketGateway.informPlayerLeft(event.roomId, event.playerId);
    }

}
