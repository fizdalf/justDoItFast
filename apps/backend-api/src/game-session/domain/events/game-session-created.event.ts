import {DomainEvent} from "../../../shared/domain/domain-event";

type RawSeat = { index: number; playerName: string; playerUserId: string };

interface GameSessionCreatedEventAttributes {
    roomId: string;
    seats: RawSeat[];
    wordPackIds: string[];
    status: string;
}

export class GameSessionCreatedEvent extends DomainEvent {

    static EVENT_NAME = 'game-session.created'

    public readonly roomId: string;
    public readonly seats: RawSeat[];
    public readonly wordPackIds: string[];
    public readonly status: string;

    constructor(
        aggregateId: string,
        roomId: string,
        seats: RawSeat[],
        wordPackIds: string[],
        status: string,
        occurredOn?: Date,
        eventId?: string,
    ) {
        super({eventName: GameSessionCreatedEvent.EVENT_NAME, aggregateId, eventId, occurredOn});
        this.roomId = roomId;
        this.seats = seats;
        this.wordPackIds = wordPackIds;
        this.status = status;
    }

    static fromPrimitives(params: {
        aggregateId: string;
        eventId: string;
        occurredOn: Date;
        attributes: GameSessionCreatedEventAttributes
    }): GameSessionCreatedEvent {
        return new GameSessionCreatedEvent(
            params.aggregateId,
            params.attributes.roomId,
            params.attributes.seats,
            params.attributes.wordPackIds,
            params.attributes.status,
            params.occurredOn,
            params.eventId,
        );
    }

    toPrimitives(): GameSessionCreatedEventAttributes {
        return {
            roomId: this.roomId,
            seats: this.seats,
            wordPackIds: this.wordPackIds,
            status: this.status,
        };
    }
}
