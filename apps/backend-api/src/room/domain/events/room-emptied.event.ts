import {DomainEvent} from "../../../shared/domain/domain-event";

interface RoomEmptiedEventAttributes {
}

export class RoomEmptiedEvent extends DomainEvent {

    static EVENT_NAME = 'room.emptied';

    constructor(
        aggregateId: string,
        occurredOn?: Date,
        eventId?: string
    ) {
        super({eventName: RoomEmptiedEvent.EVENT_NAME, aggregateId, eventId, occurredOn});
    }

    static fromPrimitives(params: {
        aggregateId: string;
        eventId: string;
        occurredOn: Date;
        attributes: RoomEmptiedEventAttributes
    }): RoomEmptiedEvent {
        return new RoomEmptiedEvent(
            params.aggregateId,
            params.occurredOn,
            params.eventId,
        );
    }

    toPrimitives(): RoomEmptiedEventAttributes {
        return {};
    }
}
