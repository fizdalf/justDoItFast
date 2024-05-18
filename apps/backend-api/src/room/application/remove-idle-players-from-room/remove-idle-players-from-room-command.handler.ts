import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {RemoveIdlePlayersFromRoomCommand} from '../../domain/commands/remove-idle-players-from-room.command';
import {Inject} from '@nestjs/common';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {RoomId} from '../../domain/valueObjects/RoomId';

@CommandHandler(RemoveIdlePlayersFromRoomCommand)
export class RemoveIdlePlayersFromRoomCommandHandler implements ICommandHandler<RemoveIdlePlayersFromRoomCommand> {
    constructor(@Inject(RoomRepository) private readonly roomRepository: RoomRepository,) {
    }

    async execute(command: RemoveIdlePlayersFromRoomCommand): Promise<void> {
        const room = await this.roomRepository.findOneById(RoomId.fromValue(command.roomId));
        room.removeIdlePlayers();
        await this.roomRepository.save(room);
    }
}
