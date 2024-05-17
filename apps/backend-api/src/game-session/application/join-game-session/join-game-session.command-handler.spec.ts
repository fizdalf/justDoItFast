import {JoinGameSessionCommandHandler} from './join-game-session.command-handler';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {GameSession} from '../../domain/aggregateRoots/GameSession';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {Team} from '../../domain/entities/Team';
import {TeamId} from '../../domain/valueObjects/TeamId';
import {Player} from '../../domain/entities/Player';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {PlayerName} from '../../domain/valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../../domain/valueObjects/playerLastContactedAt';


describe('JoinGameSessionCommandHandler', () => {
    let service: JoinGameSessionCommandHandler;
    let gameSessionRepository: jest.Mocked<GameSessionRepository>;


    beforeEach(async () => {



        gameSessionRepository = {
            findOneById: jest.fn(),
            save: jest.fn(),
            remove: jest.fn()
        };

        service = new JoinGameSessionCommandHandler(
            gameSessionRepository,
        );

    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should make the given user join the game session', async () => {
        const gameSessionId = GameSessionId.random();
        const hostPlayerId = PlayerId.random();
        const gameSession: GameSession = new GameSession({
            id: gameSessionId,
            teams: [
                new Team(TeamId.random(), [
                    new Player({id: hostPlayerId, name: PlayerName.fromValue('player1'), lastContactedAt: new PlayerLastContactedAt(new Date())}),
                ])
            ],
            host: hostPlayerId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const newPlayerId = PlayerId.random();

        gameSessionRepository.findOneById = jest.fn().mockResolvedValue(gameSession);
        const command = {
            sessionId: gameSessionId.value,
            playerId: newPlayerId.value,
            playerName: 'playerName'
        };
        await service.execute(command);

        expect(gameSessionRepository.findOneById).toHaveBeenCalledWith({value: command.sessionId});
        expect(gameSessionRepository.save).toHaveBeenCalledWith(gameSession);
    });
});
