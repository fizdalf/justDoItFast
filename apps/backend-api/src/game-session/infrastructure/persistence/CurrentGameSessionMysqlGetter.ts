import {CurrentGameSession, CurrentGameSessionGetter} from '../../domain/service/CurrentGameSessionGetter';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {Inject, Injectable} from '@nestjs/common';

class PlayerNotInSessionException extends Error {
    constructor(playerId: PlayerId, gameSessionId: GameSessionId) {
        super(`Player with id ${playerId.value} is not in session with id ${gameSessionId.value}`);
    }
}

@Injectable()
export class CurrentGameSessionMysqlGetter implements CurrentGameSessionGetter {
    constructor(@Inject(GameSessionRepository) private readonly gameSessionRepository: GameSessionRepository) {
    }

    async execute(gameSessionId: GameSessionId, playerId: PlayerId): Promise<CurrentGameSession> {
        const gameSession = await this.gameSessionRepository.findOneById(gameSessionId);

        if (!gameSession.teams.some(team => team.players.some(player => player.id.equals(playerId)))) {
            throw new PlayerNotInSessionException(playerId, gameSessionId);
        }

        return {
            id: gameSession.id.value,
            host: gameSession.host.value,
            createdAt: gameSession.createdAt,
            updatedAt: gameSession.updatedAt,
            teams: gameSession.teams.map(team => ({
                id: team.id.value,
                players: team.players.map(player => ({
                    id: player.id.value,
                    name: player.name.value,
                })),
            })),
        };

    }

}
