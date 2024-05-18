import {Controller, Post, Req, UseGuards} from '@nestjs/common';
import {RoomConnectedGuard} from '../../guards/room-connected-guard.service';
import {RoomToken} from '../../../../domain/valueObjects/RoomToken';
import {CommandBus} from '@nestjs/cqrs';
import {LeaveRoomCommand} from '../../../../domain/commands/leave-room.command';

@Controller('room')
export class LeaveRoomController {

    constructor(private readonly commandBus: CommandBus) {
    }

    @UseGuards(RoomConnectedGuard)
    @Post('leave')
    public async leaveRoom(@Req() req: { decodedData: RoomToken }) {
        await this.commandBus.execute(new LeaveRoomCommand(req.decodedData.roomId, req.decodedData.playerId));
    }
}
