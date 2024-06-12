import {RoomUserLeftEvent} from '../events/room-user-left.event';
import {EventsHandler, IEventHandler} from '@nestjs/cqrs';
import {RoomSocketGateway} from '../../infrastructure/websocket/room-socket-gateway.service';

@EventsHandler(RoomUserLeftEvent)
export class OnRoomPlayerLeftEventHandler implements IEventHandler<RoomUserLeftEvent> {
    constructor(private roomSocketGateway: RoomSocketGateway) {
    }

    async handle(event: RoomUserLeftEvent): Promise<void> {
        await this.roomSocketGateway.informPlayerLeft(event.aggregateId, event.userId);
    }

}
