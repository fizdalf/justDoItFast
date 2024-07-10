import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {Inject, Injectable} from '@nestjs/common';
import {GetGameWaitingRoomQuery} from "../../domain/query/get-game-waiting-room.query";
import {GameWaitingRoomDto} from "@org/core/game/dto/game-waiting-room.dto";
import {GameWaitingRoomGetter} from "../../domain/services/game-waiting-room.getter";

@Injectable()
@QueryHandler(GetGameWaitingRoomQuery)
export class GetCurrentRoomQueryHandler implements IQueryHandler<GetGameWaitingRoomQuery, GameWaitingRoomDto> {

    constructor(@Inject(GameWaitingRoomGetter) private gameWaitingRoomGetter: GameWaitingRoomGetter) {
    }

    async execute(query: GetGameWaitingRoomQuery) {

        return this.gameWaitingRoomGetter.execute(query.roomId, query.userId);
    }
}

