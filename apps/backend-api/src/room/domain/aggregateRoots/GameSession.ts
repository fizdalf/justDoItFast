import {UserId} from "../valueObjects/UserId";
import {GameSessionId} from "../valueObjects/GameSessionId";
import {WordPackId} from "../valueObjects/WordPackId";
import {Seats} from "../entities/Seats";
import {AggregateRoot} from "@nestjs/cqrs";
import {Teams} from "../entities/Teams";


export enum GameSessionStatus {
    CREATED = 'CREATED',
    STARTED = 'STARTED',
    FINISHED = 'FINISHED'
}

export class GameSession extends AggregateRoot {
    constructor(
        private readonly id: GameSessionId,
        private readonly seats: Seats,
        private readonly wordPackIds: WordPackId[],
        private readonly status: GameSessionStatus
    ) {
        super();
    }

    static create(teams: Teams, playerIds: UserId[], wordPackIds: WordPackId[], id: GameSessionId) {
        const seats = teams.createSeats( playerIds);
        return new GameSession(id, seats, wordPackIds, GameSessionStatus.CREATED);
    }
}

