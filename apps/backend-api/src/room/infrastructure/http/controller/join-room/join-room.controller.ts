import {Body, Controller, Param, Post} from '@nestjs/common';
import {IsNotEmpty, IsString} from 'class-validator';
import {UserId} from '../../../../domain/value-objects/UserId';
import {JoinRoomCommand} from '../../../../domain/commands/join-room.command';
import {CommandBus} from '@nestjs/cqrs';
import {AuthenticationService} from '../../../../../shared/infrastructure/authentication/authentication.service';
import {UserName} from '../../../../domain/value-objects/UserName';
import {RoomId} from '../../../../domain/value-objects/RoomId';

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
