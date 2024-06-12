import {Controller, Post, Req, UseGuards} from '@nestjs/common';
import {RoomConnectedGuard} from '../../guards/room-connected-guard.service';
import {RoomToken} from '../../../../domain/value-objects/RoomToken';
import {CommandBus} from '@nestjs/cqrs';
import {LeaveRoomCommand} from '../../../../domain/commands/leave-room.command';
import {RoomId} from "../../../../domain/value-objects/RoomId";
import {UserId} from "../../../../domain/value-objects/UserId";

@Controller('room')
export class LeaveRoomController {

    constructor(private readonly commandBus: CommandBus) {
    }

    @UseGuards(RoomConnectedGuard)
    @Post('leave')
    public async leaveRoom(@Req() req: { decodedData: RoomToken }) {
        const roomId = RoomId.fromValue(req.decodedData.roomId);
        const userId = UserId.fromValue(req.decodedData.playerId);
        await this.commandBus.execute(new LeaveRoomCommand(roomId, userId));
    }
}
