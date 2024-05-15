import {Body, Controller, Param, Post} from '@nestjs/common';
import {IsNotEmpty, IsString} from 'class-validator';
import {PlayerId} from '../../../../domain/valueObjects/PlayerId';
import {JoinGameSessionCommand} from '../../../../domain/commands/join-game-session.command';
import {CommandBus} from '@nestjs/cqrs';
import {GameSessionToken} from '../../../../domain/valueObjects/GameSessionToken';
import {JwtService} from '@nestjs/jwt';

export abstract class JoinsSessionRequestParams {
    @IsNotEmpty()
    @IsString()
    playerName: string;
}

@Controller('game-session/:id/join')
export class JoinSessionController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly jwtService: JwtService
    ) {
    }

    @Post()
    async joinSession(@Param('id') sessionId: string, @Body() body: JoinsSessionRequestParams) {
        const playerId = PlayerId.random();

        await this.commandBus.execute(new JoinGameSessionCommand(sessionId, playerId.value, body.playerName));

        const gameSessionToken = new GameSessionToken({
            gameSessionId: sessionId,
            playerName: body.playerName,
            playerId: playerId.value,
            isHost: false
        });

        return {
            success: true,
            token: this.jwtService.sign(gameSessionToken.toPrimitives())
        };

    }

}
