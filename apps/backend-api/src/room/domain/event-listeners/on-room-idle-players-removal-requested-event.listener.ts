import {CommandBus, EventsHandler} from '@nestjs/cqrs';
import {RoomIdlePlayersRemovalRequestedEvent} from '../events/room-idle-players-removal-requested.event';
import {RemoveIdlePlayersFromRoomCommand} from '../commands/remove-idle-players-from-room.command';

@EventsHandler(RoomIdlePlayersRemovalRequestedEvent)
export class OnRoomIdlePlayersRemovalRequestedEventListener {
    constructor(private readonly commandBus: CommandBus,) {
    }

    async handle(event: RoomIdlePlayersRemovalRequestedEvent): Promise<void> {
        await this.commandBus.execute(new RemoveIdlePlayersFromRoomCommand(event.roomId));
    }
}
