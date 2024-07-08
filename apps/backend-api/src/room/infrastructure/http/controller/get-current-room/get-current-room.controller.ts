import {Controller, ForbiddenException, Get, Req, UseGuards} from '@nestjs/common';
import {QueryBus} from '@nestjs/cqrs';
import {RoomConnectedGuard} from '../../guards/room-connected-guard.service';
import {RoomToken} from '../../../../domain/value-objects/RoomToken';
import {GetCurrentRoomQuery} from '../../../../domain/query/get-current-room.query';
import {CurrentRoomDto} from "@org/core/room/dto/current-room.dto";


@Controller('room')
export class GetCurrentRoomController {

    constructor(private readonly queryBus: QueryBus) {
    }

    @UseGuards(RoomConnectedGuard)
    @Get()
    async getCurrentRoom(@Req() req: { decodedData: RoomToken }) {
        try {

            return await this.queryBus.execute<GetCurrentRoomQuery, CurrentRoomDto>(new GetCurrentRoomQuery(req.decodedData.roomId, req.decodedData.playerId));
        } catch (PlayerNotInRoomException) {
            throw new ForbiddenException('Player not in room');
        }
    }
}


