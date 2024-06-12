import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {RemoveRoomCommand} from '../../domain/commands/remove-room.command';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {Inject} from '@nestjs/common';

@CommandHandler(RemoveRoomCommand)
export class RemoveRoomCommandHandler implements ICommandHandler<RemoveRoomCommand> {

    constructor(
        @Inject(RoomRepository) private repository: RoomRepository,
    ) {
    }

    async execute(command: RemoveRoomCommand): Promise<void> {
        await this.repository.remove(command.roomId);
    }
}
