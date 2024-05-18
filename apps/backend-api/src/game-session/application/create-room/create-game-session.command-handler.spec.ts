import {CreateGameSessionCommandHandler} from './create-game-session.command-handler';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {Player} from '../../domain/entities/Player';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {GameSession} from '../../domain/aggregateRoots/GameSession';
import {PlayerName} from '../../domain/valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../../domain/valueObjects/playerLastContactedAt';

describe('CreateGameSessionCommandHandler', () => {
    it('should be defined', () => {
        expect(CreateGameSessionCommandHandler).toBeDefined();
    });

    it('should create a new game session', async () => {

            const host = new Player({
                name: PlayerName.fromValue('pepe'),
                id: PlayerId.random(),
                lastContactedAt: new PlayerLastContactedAt(new Date())
            });
            const gameSessionId = GameSessionId.random();
            const command = {
                params: {
                    host: host,
                    gameSessionId: gameSessionId,
                },
            };
            const gameSessionRepository = {
                save: jest.fn(),
            };

            const createGameSessionCommandHandler = new CreateGameSessionCommandHandler(gameSessionRepository as any);

            // When
            await createGameSessionCommandHandler.execute(command);

            // Then
            expect(gameSessionRepository.save).toHaveBeenCalledWith(expect.any(GameSession));
            const savedGameSession = gameSessionRepository.save.mock.calls[0][0];
            expect(savedGameSession.id).toEqual(gameSessionId);
            expect(savedGameSession.host).toEqual(host.id);
        }
    );
});



