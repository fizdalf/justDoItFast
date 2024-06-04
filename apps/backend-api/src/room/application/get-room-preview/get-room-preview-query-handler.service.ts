import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {GetRoomPreviewQuery} from '../../domain/query/get-room-preview.query';
import {Inject, Injectable} from '@nestjs/common';
import {RoomId} from '../../domain/valueObjects/RoomId';

import {RoomPreview} from '@org/core/room/dto/roomPreview';
import {RoomPreviewService} from "../../domain/service/RoomPreviewService";


@QueryHandler(GetRoomPreviewQuery)
@Injectable()
export class GetRoomPreviewQueryHandler implements IQueryHandler<GetRoomPreviewQuery> {

    constructor(@Inject(RoomPreviewService) private service: RoomPreviewService) {
    }

    public async execute(query: GetRoomPreviewQuery): Promise<RoomPreview> {
        return await this.service.getRoomPreview(RoomId.fromValue(query.roomId));
    }
}
