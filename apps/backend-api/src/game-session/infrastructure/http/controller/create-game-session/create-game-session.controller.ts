import {Body, Controller, Post} from '@nestjs/common';
import {IsNotEmpty} from 'class-validator';
import {CommandBus} from '@nestjs/cqrs';
import {CreateGameSession} from '../../../../domain/commands/create-game-session.command';
import {GameSessionId} from '../../../../domain/valueObjects/GameSessionId';
import {PlayerId} from '../../../../domain/valueObjects/PlayerId';
import {Player} from '../../../../domain/entities/Player';
import {PlayerName} from '../../../../domain/valueObjects/PlayerName';
import {GameSessionToken} from '../../../../domain/valueObjects/GameSessionToken';
import {JwtService} from '@nestjs/jwt';

export abstract class CreateGameSessionRequestParams {
    @IsNotEmpty()
    hostPlayerName: string;
}

@Controller('game-session')
export class CreateGameSessionController {

    constructor(private readonly commandBus: CommandBus, private readonly jwtService: JwtService) {
    }

    @Post()
    async createGameSession(@Body() body: CreateGameSessionRequestParams) {

        const gameSessionId = GameSessionId.random();
        const hostPlayerId = PlayerId.random();

        const host = new Player({id: hostPlayerId, name: PlayerName.fromValue(body.hostPlayerName)});
        await this.commandBus.execute(
            new CreateGameSession({
                gameSessionId,
                host
            })
        );

        const gameSessionToken = GameSessionToken.fromDomain({gameSessionId, player: host, isHost: true});

        return {
            success: true,
            token: this.jwtService.sign(gameSessionToken.toPrimitives())
        };
    }
}


