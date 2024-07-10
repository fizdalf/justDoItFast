import {RoomUserJoinedEvent} from '../events/room-user-joined.event';
import {EventsHandler, IEventHandler} from '@nestjs/cqrs';
import {RoomSocketGateway} from '../../infrastructure/websocket/room-socket-gateway.service';

@EventsHandler(RoomUserJoinedEvent)
export class OnRoomJoinedEventHandler implements IEventHandler<RoomUserJoinedEvent> {
    constructor(private roomSocketGateway: RoomSocketGateway) {
    }

    async handle(event: RoomUserJoinedEvent): Promise<void> {
        await this.roomSocketGateway.informPlayerJoined(event.aggregateId, event.userName);
    }

}
