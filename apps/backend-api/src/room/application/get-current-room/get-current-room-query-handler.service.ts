import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {GetCurrentRoomQuery} from '../../domain/query/get-current-room.query';
import {RoomId} from '../../domain/valueObjects/RoomId';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {CurrentRoomGetter} from '../../domain/service/CurrentRoomGetter';
import {Inject, Injectable} from '@nestjs/common';

@Injectable()
@QueryHandler(GetCurrentRoomQuery)
export class GetCurrentRoomQueryHandler implements IQueryHandler<GetCurrentRoomQuery> {

    constructor(@Inject(CurrentRoomGetter) private currentSessionGetter: CurrentRoomGetter) {
    }

    async execute(query: GetCurrentRoomQuery) {

        return this.currentSessionGetter.execute(RoomId.fromValue(query.roomId), PlayerId.fromValue(query.playerId));
    }
}
