import {RegisterPlayerContactCommand} from '../../domain/commands/register-player-contact.command';
import {CommandHandler, ICommandHandler} from '@nestjs/cqrs';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {Inject} from '@nestjs/common';
import {RoomId} from '../../domain/valueObjects/RoomId';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {DateTimeService} from '../../../shared/domain/date-time.service';

@CommandHandler(RegisterPlayerContactCommand)
export class RegisterPlayerContactCommandHandler implements ICommandHandler<RegisterPlayerContactCommand> {

    constructor(
        @Inject(RoomRepository) private readonly roomRepository: RoomRepository,
        @Inject(DateTimeService) private readonly dateTimeService: DateTimeService
    ) {
    }

    async execute(command: RegisterPlayerContactCommand): Promise<void> {
        const room = await this.roomRepository.findOneById(RoomId.fromValue(command.roomId));
        room.registerPlayerContact(PlayerId.fromValue(command.playerId), this.dateTimeService.now());
        await this.roomRepository.save(room);
    }
}
