import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {GetCurrentSessionQuery} from '../../domain/query/get-current-session.query';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {CurrentGameSessionGetter} from '../../domain/service/CurrentGameSessionGetter';
import {Inject, Injectable} from '@nestjs/common';

@Injectable()
@QueryHandler(GetCurrentSessionQuery)
export class GetCurrentSessionQueryHandler implements IQueryHandler<GetCurrentSessionQuery> {

    constructor(@Inject(CurrentGameSessionGetter) private currentSessionGetter: CurrentGameSessionGetter) {
    }

    async execute(query: GetCurrentSessionQuery) {

        return this.currentSessionGetter.execute(GameSessionId.fromValue(query.sessionId), PlayerId.fromValue(query.playerId));
    }
}
