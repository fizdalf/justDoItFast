import {GameSessionId} from "../../../room/domain/value-objects/GameSessionId";
import {WordPackId} from "../../../room/domain/value-objects/WordPackId";
import {Seats} from "./Seats";
import {AggregateRoot} from "@nestjs/cqrs";
import {Room} from "../../../room/domain/aggregateRoots/Room";
import {UserId} from "../../../room/domain/value-objects/UserId";
import {RoomId} from "../../../room/domain/value-objects/RoomId";
import {GameSessionCreatedEvent} from "../events/game-session-created.event";
import {Player} from "./Player";


export enum GameSessionStatus {
    CREATED = 'CREATED',
    STARTED = 'STARTED',
    FINISHED = 'FINISHED'
}

export class GameSession extends AggregateRoot {
    constructor(
        private readonly id: GameSessionId,
        private readonly roomId: RoomId,
        private readonly seats: Seats,
        private readonly wordPackIds: WordPackId[],
        private readonly status: GameSessionStatus
    ) {
        super();
    }

    static create(room: Room, creator: UserId, wordPackIds: WordPackId[], id: GameSessionId, currentDate: Date): GameSession {

        const seats = new Seats();

        room.processUsers(creator, (users) => {
            users.forEach(user => seats.add(new Player(user.id, user.name.value)))
        })

        const instance = new GameSession(id, room.id, seats, wordPackIds, GameSessionStatus.CREATED);
        instance.apply(new GameSessionCreatedEvent(
            instance.id.value,
            instance.roomId.value,
            instance.seats.toArray().map(seat => ({
                index: seat.index,
                playerName: seat.player.name,
                playerUserId: seat.player.id.value
            })),
            instance.wordPackIds.map(wordPackId => wordPackId.value),
            instance.status,
            currentDate,
        ))
        return instance;
    }

}

