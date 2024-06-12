import {Body, Controller, Post} from '@nestjs/common';
import {IsNotEmpty} from 'class-validator';
import {CommandBus} from '@nestjs/cqrs';
import {CreateRoom} from '../../../../domain/commands/create-room.command';
import {RoomId} from '../../../../domain/value-objects/RoomId';
import {UserId} from '../../../../domain/value-objects/UserId';
import {UserName} from '../../../../domain/value-objects/UserName';
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
        const userId = UserId.random();

        await this.commandBus.execute(
            new CreateRoom({
                roomId: roomId,
                userId: userId,
                userName: UserName.fromValue(body.hostPlayerName)
            })
        );

        return {
            success: true,
            token: this.authenticationService.generateToken({
                roomId: roomId,
                isHost: true,
                userName: body.hostPlayerName,
                userId: userId.value
            })
        };
    }
}


