import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {RemoveIdlePlayersFromRoomCommand} from '../../domain/commands/remove-idle-players-from-room.command';
import {Inject} from '@nestjs/common';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {DateTimeService} from "../../../shared/domain/date-time.service";

@CommandHandler(RemoveIdlePlayersFromRoomCommand)
export class RemoveIdlePlayersFromRoomCommandHandler implements ICommandHandler<RemoveIdlePlayersFromRoomCommand> {
    constructor(@Inject(RoomRepository) private readonly roomRepository: RoomRepository,
                @Inject(DateTimeService) private readonly dateTimeService: DateTimeService,
                ) {
    }

    async execute(command: RemoveIdlePlayersFromRoomCommand): Promise<void> {
        const room = await this.roomRepository.findOneById(command.roomId);
        room.removeIdleUsers(this.dateTimeService.now());
        await this.roomRepository.save(room);
    }
}
