import {Body, Controller, Post} from '@nestjs/common';
import {IsNotEmpty} from 'class-validator';
import {CommandBus} from '@nestjs/cqrs';
import {CreateGameSession} from '../../../../domain/commands/create-game-session.command';
import {GameSessionId} from '../../../../domain/valueObjects/GameSessionId';
import {PlayerId} from '../../../../domain/valueObjects/PlayerId';
import {Player} from '../../../../domain/entities/Player';
import {PlayerName} from '../../../../domain/valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../../../../domain/valueObjects/playerLastContactedAt';
import {AuthenticationService} from '../../../authentication/AuthenticationService';

export abstract class CreateGameSessionRequestParams {
    @IsNotEmpty()
    hostPlayerName: string;
}

@Controller('game-session')
export class CreateGameSessionController {

    constructor(
        private readonly commandBus: CommandBus,
        private readonly authenticationService: AuthenticationService
    ) {
    }

    @Post()
    async createGameSession(@Body() body: CreateGameSessionRequestParams) {

        const gameSessionId = GameSessionId.random();
        const player = new Player({
            id: PlayerId.random(),
            name: PlayerName.fromValue(body.hostPlayerName),
            lastContactedAt: PlayerLastContactedAt.create(new Date())
        });
        await this.commandBus.execute(
            new CreateGameSession({
                gameSessionId,
                host: player
            })
        );

        return {
            success: true,
            token: this.authenticationService.generateToken({
                gameSessionId: gameSessionId,
                player,
                isHost: true

            })
        };
    }
}


