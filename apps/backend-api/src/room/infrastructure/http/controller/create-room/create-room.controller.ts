import {Body, Controller, Post} from '@nestjs/common';
import {IsNotEmpty} from 'class-validator';
import {CommandBus} from '@nestjs/cqrs';
import {CreateRoom} from '../../../../domain/commands/create-room.command';
import {RoomId} from '../../../../domain/valueObjects/RoomId';
import {PlayerId} from '../../../../domain/valueObjects/PlayerId';
import {Player} from '../../../../domain/entities/Player';
import {PlayerName} from '../../../../domain/valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../../../../domain/valueObjects/playerLastContactedAt';
import {AuthenticationService} from '../../../authentication/AuthenticationService';

export abstract class CreateRoomRequestParams {
    @IsNotEmpty()
    hostPlayerName: string;
}

@Controller('room')
export class CreateRoomController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly authenticationService: AuthenticationService
    ) {
    }

    @Post()
    async createRoom(@Body() body: CreateRoomRequestParams) {

        const roomId = RoomId.random();
        const player = new Player({
            id: PlayerId.random(),
            name: PlayerName.fromValue(body.hostPlayerName),
            lastContactedAt: PlayerLastContactedAt.create(new Date())
        });
        await this.commandBus.execute(
            new CreateRoom({
                roomId: roomId,
                host: player
            })
        );

        return {
            success: true,
            token: this.authenticationService.generateToken({
                roomId: roomId,
                player,
                isHost: true

            })
        };
    }
}


