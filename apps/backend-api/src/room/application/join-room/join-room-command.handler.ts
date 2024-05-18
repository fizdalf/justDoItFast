import {CommandHandler, ICommandHandler,} from '@nestjs/cqrs';
import {JoinRoomCommand} from '../../domain/commands/join-room.command';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {Player} from '../../domain/entities/Player';
import {Inject} from '@nestjs/common';
import {RoomId} from '../../domain/valueObjects/RoomId';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {PlayerName} from '../../domain/valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../../domain/valueObjects/playerLastContactedAt';


@CommandHandler(JoinRoomCommand)
export class JoinRoomCommandHandler implements ICommandHandler<JoinRoomCommand> {
    constructor(
        @Inject(RoomRepository) private readonly roomRepository: RoomRepository    ) {
    }

    async execute(command: JoinRoomCommand) {
        const room = await this.roomRepository.findOneById(RoomId.fromValue(command.sessionId));

        const player = new Player({
            id: PlayerId.fromValue(command.playerId),
            name: PlayerName.fromValue(command.playerName),
            lastContactedAt: PlayerLastContactedAt.create(new Date())
        });
        room.addPlayer(player);

        await this.roomRepository.save(room);
    }
}
