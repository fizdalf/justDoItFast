import {
    RequestIdlePlayersRemovalFromRoomCommand
} from '../../domain/commands/request-idle-players-removal-from-room.command';
import {CommandHandler, EventBus, ICommandHandler, IEventBus} from '@nestjs/cqrs';
import {Inject} from '@nestjs/common';
import {RoomIdlePlayersRemovalRequestedEvent} from '../../domain/events/room-idle-players-removal-requested.event';
import {RoomsIdsGetter} from '../../domain/service/RoomsIdsGetter';

@CommandHandler(RequestIdlePlayersRemovalFromRoomCommand)
export class RequestIdlePlayersRemovalFromRoomCommandHandler implements ICommandHandler<RequestIdlePlayersRemovalFromRoomCommand> {
    constructor(
        @Inject(RoomsIdsGetter) private readonly roomsIdsGetter: RoomsIdsGetter,
        @Inject(EventBus) private readonly eventBus: IEventBus,
    ) {
    }

    async execute(_command: RequestIdlePlayersRemovalFromRoomCommand): Promise<void> {
        const roomsIds = await this.roomsIdsGetter.getRoomsIds();

        roomsIds.forEach(roomId => {
            this.eventBus.publish(new RoomIdlePlayersRemovalRequestedEvent(roomId.value));
        });
    }
}
