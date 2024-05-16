import {Body, Controller, Param, Post} from '@nestjs/common';
import {IsNotEmpty, IsString} from 'class-validator';
import {PlayerId} from '../../../../domain/valueObjects/PlayerId';
import {JoinGameSessionCommand} from '../../../../domain/commands/join-game-session.command';
import {CommandBus} from '@nestjs/cqrs';
import {AuthenticationService} from '../../../authentication/AuthenticationService';
import {PlayerName} from '../../../../domain/valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../../../../domain/valueObjects/playerLastContactedAt';
import {Player} from '../../../../domain/entities/Player';
import {GameSessionId} from '../../../../domain/valueObjects/GameSessionId';

export abstract class JoinsSessionRequestParams {
    @IsNotEmpty()
    @IsString()
    playerName: string;
}

@Controller('game-session/:id/join')
export class JoinSessionController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly authenticationService: AuthenticationService
    ) {
    }

    @Post()
    async joinSession(@Param('id') sessionId: string, @Body() body: JoinsSessionRequestParams) {
        const playerId = PlayerId.random();

        await this.commandBus.execute(new JoinGameSessionCommand(sessionId, playerId.value, body.playerName));

        const token = this.authenticationService.generateToken({
            gameSessionId: GameSessionId.fromValue(sessionId),
            player: new Player({
                id: playerId,
                name: PlayerName.fromValue(body.playerName),
                lastContactedAt: PlayerLastContactedAt.create(new Date())
            }),
            isHost: false
        })
        return {
            success: true,
            token: token
        };

    }

}
