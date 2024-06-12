import {CommandHandler, ICommandHandler,} from '@nestjs/cqrs';
import {JoinRoomCommand} from '../../domain/commands/join-room.command';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {Inject} from '@nestjs/common';
import {DateTimeService} from "../../../shared/domain/date-time.service";


@CommandHandler(JoinRoomCommand)
export class JoinRoomCommandHandler implements ICommandHandler<JoinRoomCommand> {
    constructor(
        @Inject(RoomRepository) private readonly roomRepository: RoomRepository,
        @Inject(DateTimeService) private readonly dateTimeService: DateTimeService,
    ) {
    }

    async execute(command: JoinRoomCommand) {
        const room = await this.roomRepository.findOneById(command.roomId);
        room.addUser(command.userId, command.userName, this.dateTimeService.now());

        await this.roomRepository.save(room);
    }
}
