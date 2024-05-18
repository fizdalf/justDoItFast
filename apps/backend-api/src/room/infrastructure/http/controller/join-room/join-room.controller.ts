import {Body, Controller, Param, Post} from '@nestjs/common';
import {IsNotEmpty, IsString} from 'class-validator';
import {PlayerId} from '../../../../domain/valueObjects/PlayerId';
import {JoinRoomCommand} from '../../../../domain/commands/join-room.command';
import {CommandBus} from '@nestjs/cqrs';
import {AuthenticationService} from '../../../authentication/AuthenticationService';
import {PlayerName} from '../../../../domain/valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../../../../domain/valueObjects/playerLastContactedAt';
import {Player} from '../../../../domain/entities/Player';
import {RoomId} from '../../../../domain/valueObjects/RoomId';

export abstract class JoinsSessionRequestParams {
    @IsNotEmpty()
    @IsString()
    playerName: string;
}

@Controller('room/:id/join')
export class JoinRoomController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly authenticationService: AuthenticationService
    ) {
    }

    @Post()
    async joinSession(@Param('id') sessionId: string, @Body() body: JoinsSessionRequestParams) {
        const playerId = PlayerId.random();

        await this.commandBus.execute(new JoinRoomCommand(sessionId, playerId.value, body.playerName));

        const token = this.authenticationService.generateToken({
            roomId: RoomId.fromValue(sessionId),
            player: new Player({
                id: playerId,
                name: PlayerName.fromValue(body.playerName),
                lastContactedAt: PlayerLastContactedAt.create(new Date())
            }),
            isHost: false
        })
        return {
            success: true,
            token: token
        };

    }

}
