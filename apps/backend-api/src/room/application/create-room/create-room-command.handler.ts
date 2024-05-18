import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {CreateRoom} from '../../domain/commands/create-room.command';
import {Room} from '../../domain/aggregateRoots/Room';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {Inject} from '@nestjs/common';


@CommandHandler(CreateRoom)
export class CreateRoomCommandHandler implements ICommandHandler<CreateRoom> {
    constructor(@Inject(RoomRepository) private roomRepository: RoomRepository) {
    }

    async execute(command: CreateRoom) {
        const session = Room.create(command.params.host, command.params.roomId);
        await this.roomRepository.save(session);



    }
}
