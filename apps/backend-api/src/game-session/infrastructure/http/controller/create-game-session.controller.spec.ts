import {CreateGameSessionController} from './create-game-session.controller';
import {CommandBus} from '@nestjs/cqrs';
import {CreateGameSession} from '../../../domain/commands/create-game-session.command';
import {GameSessionId} from '../../../domain/valueObjects/GameSessionId';
import {Player} from '../../../domain/entities/Player';
import {PlayerId} from '../../../domain/valueObjects/PlayerId';
import {PlayerName} from '../../../domain/valueObjects/PlayerName';


describe('CreateGameSessionController', () => {
    let createGameSessionController: CreateGameSessionController;

    let commandBusMock = {
        execute: jest.fn()
    }

    beforeAll(async () => {
        createGameSessionController = new CreateGameSessionController(commandBusMock as unknown as CommandBus);
    });

    describe('createGameSession', () => {
        it('should execute create game session command', async () => {

            await createGameSessionController.createGameSession({
                gameSessionId: 'test',
                hostPlayerName: 'test',
                hostId: 'test'
            });

            expect(commandBusMock.execute).toHaveBeenCalledWith(
                new CreateGameSession({
                    gameSessionId: new GameSessionId('test'),
                    host: new Player({name: new PlayerName('test'), id: new PlayerId('test')})
                })
            );
        });
    });
});
