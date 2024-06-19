import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {LeaveRoomCommand} from '../../domain/commands/leave-room.command';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {Inject} from '@nestjs/common';

@CommandHandler(LeaveRoomCommand)
export class LeaveRoomCommandHandler implements ICommandHandler<LeaveRoomCommand> {

    constructor(
        @Inject(RoomRepository) private readonly roomRepository: RoomRepository,
    ) {

    }

    async execute(command: LeaveRoomCommand): Promise<void> {
        const room = await this.roomRepository.findOneById(command.roomId);
        room.leave(command.userId);
        await this.roomRepository.save(room);
    }
}
