import {DomainEvent} from "../../../shared/domain/domain-event";

export class RoomRemovedEvent extends DomainEvent {
    static readonly EVENT_NAME = "room.removed";

    constructor(
        aggregateId: string,
        occurredOn?: Date,
        eventId?: string
    ) {
        super({aggregateId, occurredOn, eventName: RoomRemovedEvent.EVENT_NAME, eventId});
    }

    static fromPrimitives({aggregateId, occurredOn, eventId}): RoomRemovedEvent {
        return new RoomRemovedEvent(aggregateId, occurredOn, eventId);
    }

    toPrimitives(): any {
        return {};
    }
}
