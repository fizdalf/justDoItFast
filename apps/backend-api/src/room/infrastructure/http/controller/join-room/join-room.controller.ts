import {Body, Controller, Param, Post} from '@nestjs/common';
import {IsNotEmpty, IsString} from 'class-validator';
import {UserId} from '../../../../domain/valueObjects/UserId';
import {JoinRoomCommand} from '../../../../domain/commands/join-room.command';
import {CommandBus} from '@nestjs/cqrs';
import {AuthenticationService} from '../../../authentication/AuthenticationService';
import {UserName} from '../../../../domain/valueObjects/UserName';
import {RoomId} from '../../../../domain/valueObjects/RoomId';

export abstract class JoinsSessionRequestParams {
    @IsNotEmpty()
    @IsString()
    userName: string;
}

@Controller('room/:id/join')
export class JoinRoomController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly authenticationService: AuthenticationService
    ) {
    }

    @Post()
    async joinSession(@Param('id') roomId: string, @Body() body: JoinsSessionRequestParams) {
        const userId = UserId.random();

        await this.commandBus.execute(new JoinRoomCommand(
                RoomId.fromValue(roomId),
                userId,
                UserName.fromValue(body.userName)
            )
        );

        const token = this.authenticationService.generateToken({
            roomId: RoomId.fromValue(roomId),
            isHost: false,
            userName: body.userName,
            userId: userId.value
        })
        return {
            success: true,
            token: token
        };

    }

}
