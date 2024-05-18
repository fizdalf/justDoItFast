import {Controller, Get, Param} from '@nestjs/common';
import {QueryBus} from '@nestjs/cqrs';
import {GetRoomPreviewQuery} from '../../../../domain/query/get-room-preview.query';

@Controller('room/:id/preview')
export class GetRoomPreviewController {

    constructor(private readonly queryBus: QueryBus) {
    }

    @Get()
    async getRoomPreview(@Param('id') sessionId: string) {

        return await this.queryBus.execute(new GetRoomPreviewQuery(sessionId));
    }
}


