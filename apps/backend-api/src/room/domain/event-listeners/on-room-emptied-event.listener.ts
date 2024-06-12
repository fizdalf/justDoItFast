import {CommandBus, EventsHandler} from '@nestjs/cqrs';
import {RoomEmptiedEvent} from '../events/room-emptied.event';
import {RemoveRoomCommand} from '../commands/remove-room.command';
import {RoomId} from "../value-objects/RoomId";

@EventsHandler(RoomEmptiedEvent)
export class OnRoomEmptiedEventListener {
    constructor(private readonly commandBus: CommandBus) {
    }

    async handle(event: RoomEmptiedEvent): Promise<void> {
        await this.commandBus.execute(new RemoveRoomCommand(RoomId.fromValue(event.aggregateId)));
    }
}
