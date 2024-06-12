import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {LeaveRoomCommand} from '../../domain/commands/leave-room.command';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {Inject} from '@nestjs/common';
import {DateTimeService} from "../../../shared/domain/date-time.service";

@CommandHandler(LeaveRoomCommand)
export class LeaveRoomCommandHandler implements ICommandHandler<LeaveRoomCommand> {

    constructor(
        @Inject(RoomRepository) private readonly roomRepository: RoomRepository,
        @Inject(DateTimeService) private readonly dateTimeService: DateTimeService
    ) {

    }

    async execute(command: LeaveRoomCommand): Promise<void> {
        const room = await this.roomRepository.findOneById(command.roomId);
        room.leave(command.playerId, this.dateTimeService.now());
        await this.roomRepository.save(room);
    }
}
