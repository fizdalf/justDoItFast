import {Controller, Post, Req, UseGuards} from '@nestjs/common';
import {GameSessionGuard} from '../../guards/GameSessionGuard';
import {GameSessionToken} from '../../../../domain/valueObjects/GameSessionToken';
import {CommandBus} from '@nestjs/cqrs';
import {LeaveGameSessionCommand} from '../../../../domain/commands/leave-game-session.command';

@Controller('game-session')
export class LeaveGameSessionController {

    constructor(private readonly commandBus: CommandBus) {
    }

    @UseGuards(GameSessionGuard)
    @Post('leave')
    public async leaveGameSession(@Req() req: { decodedData: GameSessionToken }) {
        await this.commandBus.execute(new LeaveGameSessionCommand(req.decodedData.gameSessionId, req.decodedData.playerId));
    }
}
