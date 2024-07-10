import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {GetCurrentRoomQuery} from '../../domain/query/get-current-room.query';
import {RoomId} from '../../domain/value-objects/RoomId';
import {UserId} from '../../domain/value-objects/UserId';
import {CurrentRoomGetter} from '../../domain/service/CurrentRoomGetter';
import {Inject, Injectable} from '@nestjs/common';
import {CurrentRoomDto} from "@org/core/room/dto/current-room.dto";

@Injectable()
@QueryHandler(GetCurrentRoomQuery)
export class GetCurrentRoomQueryHandler implements IQueryHandler<GetCurrentRoomQuery, CurrentRoomDto> {

    constructor(@Inject(CurrentRoomGetter) private currentSessionGetter: CurrentRoomGetter) {
    }

    async execute(query: GetCurrentRoomQuery) {

        return this.currentSessionGetter.execute(RoomId.fromValue(query.roomId), UserId.fromValue(query.playerId));
    }
}
