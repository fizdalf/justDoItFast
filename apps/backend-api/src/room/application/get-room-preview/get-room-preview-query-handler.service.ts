import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {GetRoomPreviewQuery} from '../../domain/query/get-room-preview.query';
import {Inject, Injectable} from '@nestjs/common';
import {RoomId} from '../../domain/value-objects/RoomId';

import {RoomPreviewDto} from '@org/core/room/dto/room-preview.dto';
import {RoomPreviewService} from "../../domain/service/RoomPreviewService";


@QueryHandler(GetRoomPreviewQuery)
@Injectable()
export class GetRoomPreviewQueryHandler implements IQueryHandler<GetRoomPreviewQuery, RoomPreviewDto> {

    constructor(@Inject(RoomPreviewService) private service: RoomPreviewService) {
    }

    public async execute(query: GetRoomPreviewQuery): Promise<RoomPreviewDto> {
        return await this.service.getRoomPreview(RoomId.fromValue(query.roomId));
    }
}
