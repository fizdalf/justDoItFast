import {Controller, Get, Req, UseGuards} from '@nestjs/common';
import {QueryBus} from '@nestjs/cqrs';
import {RoomConnectedGuard} from "../../../../../room/infrastructure/http/guards/room-connected-guard.service";
import {RoomToken} from "../../../../../room/domain/value-objects/RoomToken";
import {RoomId} from "../../../../../room/domain/value-objects/RoomId";
import {UserId} from "../../../../../room/domain/value-objects/UserId";
import {GetGameWaitingRoomQuery} from "../../../../domain/query/get-game-waiting-room.query";

@UseGuards(RoomConnectedGuard)
@Controller('game')
export class GetGameWaitingRoomController {

    constructor(private readonly queryBus: QueryBus,) {
    }

    @Get()
    async createGame(@Req() req: { decodedData: RoomToken }) {
        return await this.queryBus.execute(new GetGameWaitingRoomQuery(
                RoomId.fromValue(req.decodedData.roomId),
                UserId.fromValue(req.decodedData.playerId)
            )
        );
    }
}


