import {CreateGameSessionController} from './create-game-session.controller';
import {CommandBus} from '@nestjs/cqrs';
import {CreateGameSession} from '../../../../domain/commands/create-game-session.command';
import {GameSessionId} from '../../../../domain/valueObjects/GameSessionId';
import {Player} from '../../../../domain/entities/Player';
import {PlayerId} from '../../../../domain/valueObjects/PlayerId';
import {PlayerName} from '../../../../domain/valueObjects/PlayerName';
import {JwtService} from '@nestjs/jwt';


describe('CreateGameSessionController', () => {
    let createGameSessionController: CreateGameSessionController;

    let commandBusMock = {
        execute: jest.fn()
    }
    let jwtServiceMock = {
        sign: jest.fn()
    }

    beforeAll(async () => {
        createGameSessionController = new CreateGameSessionController(
            commandBusMock as unknown as CommandBus,
            jwtServiceMock as unknown as JwtService
        );
    });

    describe('createGameSession', () => {
        it('should execute create game session command', async () => {

            await createGameSessionController.createGameSession({hostPlayerName: 'test',});

            expect(commandBusMock.execute).toHaveBeenCalledWith(
                new CreateGameSession({
                    gameSessionId: expect.any(GameSessionId),
                    host: new Player({
                        id: expect.any(PlayerId),
                        name: PlayerName.fromValue('test')
                    })
                })
            );
        });
    });
});
