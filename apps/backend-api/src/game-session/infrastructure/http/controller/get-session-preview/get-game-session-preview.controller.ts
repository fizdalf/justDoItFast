import {Controller, Get, Query} from '@nestjs/common';
import {QueryBus} from '@nestjs/cqrs';
import {GetGameSessionPreviewQuery} from '../../../../domain/query/get-game-session-preview.query';

@Controller('game-session-preview/:sessionId')
export class GetGameSessionPreviewController {

    constructor(private readonly queryBus: QueryBus) {
    }

    @Get()
    async createGameSession(@Query('sessionId') sessionId: string) {

        return await this.queryBus.execute(new GetGameSessionPreviewQuery(sessionId));
    }
}


