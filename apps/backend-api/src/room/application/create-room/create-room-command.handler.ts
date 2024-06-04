import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {CreateRoom} from '../../domain/commands/create-room.command';
import {Room} from '../../domain/aggregateRoots/Room';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {Inject} from '@nestjs/common';
import {DateTimeService} from "../../../shared/domain/date-time.service";


@CommandHandler(CreateRoom)
export class CreateRoomCommandHandler implements ICommandHandler<CreateRoom> {
    constructor(
        @Inject(RoomRepository) private roomRepository: RoomRepository,
        @Inject(DateTimeService) private dateTimeService: DateTimeService,
    ) {
    }

    async execute(command: CreateRoom) {
        const session = Room.create(
            command.roomId,
            command.userId,
            command.userName,
            this.dateTimeService.now()
        );
        await this.roomRepository.save(session);
    }
}
