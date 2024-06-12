import {DomainEvent} from "../../../shared/domain/domain-event";

type RoomIdlePlayersRemovalRequestedEventAttributes = any;

export class RoomIdlePlayersRemovalRequestedEvent extends DomainEvent {
    static readonly EVENT_NAME = "room.idle-players-removal-requested";

    constructor(
        aggregateId: string,
        occurredOn?: Date,
        eventId?: string
    ) {
        super({aggregateId, occurredOn, eventName: RoomIdlePlayersRemovalRequestedEvent.EVENT_NAME, eventId});
    }

    static fromPrimitives({aggregateId, occurredOn, eventId, attributes}): RoomIdlePlayersRemovalRequestedEvent {
        return new RoomIdlePlayersRemovalRequestedEvent(aggregateId, occurredOn, eventId);
    }

    toPrimitives(): RoomIdlePlayersRemovalRequestedEventAttributes {
        return {};
    }
}
