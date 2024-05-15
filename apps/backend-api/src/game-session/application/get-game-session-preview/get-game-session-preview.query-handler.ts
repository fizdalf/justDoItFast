import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {GetGameSessionPreviewQuery} from '../../domain/query/get-game-session-preview.query';
import {GameSessionRepository} from '../../domain/repositories/game-session.repository';
import {Inject, Injectable} from '@nestjs/common';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';

import {GameSessionPreview} from '@org/core/game-session/dto/gameSessionPreview';


@QueryHandler(GetGameSessionPreviewQuery)
@Injectable()
export class GetGameSessionPreviewQueryHandler implements IQueryHandler<GetGameSessionPreviewQuery> {

    constructor(@Inject(GameSessionRepository) private gameSessionRepository: GameSessionRepository) {
    }

    public async execute(query: GetGameSessionPreviewQuery): Promise<GameSessionPreview> {
        const gameSession = await this.gameSessionRepository.findOneById(GameSessionId.fromValue(query.sessionId));

        return {
            id: gameSession.id.value,
            hostPlayerName: gameSession.hostPlayerName().value,
            teams: gameSession.teams.map(team => ({
                players: team.players.map(player => ({
                    name: player.name.value,
                })),
            }))
        };
    }
}
