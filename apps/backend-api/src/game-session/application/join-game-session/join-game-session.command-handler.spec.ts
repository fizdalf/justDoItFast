import {JoinGameSessionCommandHandler} from './join-game-session.command-handler';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {IEventBus} from '@nestjs/cqrs';
import {GameSession} from '../../domain/aggregateRoots/GameSession';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {Team} from '../../domain/entities/Team';
import {TeamId} from '../../domain/valueObjects/TeamId';
import {Player} from '../../domain/entities/Player';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {PlayerName} from '../../domain/valueObjects/PlayerName';
import {GameSessionPlayerJoinedEvent} from '../../domain/events/game-session-player-joined.event';


describe('JoinGameSessionCommandHandler', () => {
    let service: JoinGameSessionCommandHandler;
    let gameSessionRepository: jest.Mocked<GameSessionRepository>;
    let eventBus: jest.Mocked<IEventBus>;

    beforeEach(async () => {

        eventBus = {
            publish: jest.fn(),
            publishAll: jest.fn()
        } as jest.Mocked<IEventBus>;

        gameSessionRepository = {
            findOneById: jest.fn(),
            save: jest.fn()
        };

        service = new JoinGameSessionCommandHandler(
            gameSessionRepository,
            eventBus
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
                    new Player({id: hostPlayerId, name: PlayerName.fromValue('player1')}),
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
        expect(eventBus.publishAll).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    gameSessionId: gameSessionId.value,
                    playerId: newPlayerId.value,
                    playerName: 'playerName'
                })
            ])
        );

        const events = eventBus.publishAll.mock.calls[0][0];
        expect(events[0]).toBeInstanceOf(GameSessionPlayerJoinedEvent);
    });
});
