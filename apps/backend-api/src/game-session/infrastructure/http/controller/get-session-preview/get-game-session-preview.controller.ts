import {Controller, Get, Query} from '@nestjs/common';
import {IsNotEmpty} from 'class-validator';
import {QueryBus} from '@nestjs/cqrs';
import {GetGameSessionPreviewQuery} from '../../../../domain/query/get-game-session-preview.query';


export class CreateGameSessionRequestParams {
    @IsNotEmpty()
    hostPlayerName: string;
}

@Controller('game-session-preview/:sessionId')
export class CreateGameSessionController {

    constructor(private readonly queryBus: QueryBus) {
    }

    @Get()
    async createGameSession(@Query('sessionId') sessionId: string) {

        return await this.queryBus.execute(new GetGameSessionPreviewQuery(sessionId));
    }
}


