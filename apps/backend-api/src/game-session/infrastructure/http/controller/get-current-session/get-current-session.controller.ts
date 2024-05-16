import {Controller, ForbiddenException, Get, Req, UseGuards} from '@nestjs/common';
import {QueryBus} from '@nestjs/cqrs';
import {GameSessionGuard} from '../../guards/GameSessionGuard';
import {GameSessionToken} from '../../../../domain/valueObjects/GameSessionToken';
import {GetCurrentSessionQuery} from '../../../../domain/query/get-current-session.query';


@Controller('game-session')
export class GetCurrentSessionController {

    constructor(private readonly queryBus: QueryBus) {
    }

    @UseGuards(GameSessionGuard)
    @Get()
    async getCurrentGameSession(@Req() req: { decodedData: GameSessionToken }) {
        try {

            return await this.queryBus.execute(new GetCurrentSessionQuery(req.decodedData.gameSessionId, req.decodedData.playerId));
        } catch (PlayerNotInGameSessionException) {
            throw new ForbiddenException('Player not in game session');
        }
    }
}


