import {DomainEvent} from "../../../shared/domain/domain-event";

interface RoomPlayerContactRegisteredEventAttributes {
    lastContactedAt: string;
    userId: string;
}

export class RoomUserContactRegisteredEvent extends DomainEvent {
    static readonly EVENT_NAME: string = "room.user-contact-registered";

    public readonly userId: string;
    public readonly lastContactedAt: string;


    constructor(
        aggregateId: string,
        userId: string,
        lastContactedAt: string,
        occurredOn?: Date,
        eventId?: string
    ) {
        super({aggregateId, occurredOn, eventName: RoomUserContactRegisteredEvent.EVENT_NAME, eventId});
        this.lastContactedAt = lastContactedAt;
        this.userId = userId;
    }

    static fromPrimitives(params: {
        aggregateId: string,
        eventId: string,
        occurredOn: Date,
        attributes: RoomPlayerContactRegisteredEventAttributes
    }): DomainEvent {
        const {aggregateId, eventId, occurredOn, attributes} = params;
        return new RoomUserContactRegisteredEvent(aggregateId, attributes.userId, attributes.lastContactedAt, occurredOn, eventId);
    }

    toPrimitives(): RoomPlayerContactRegisteredEventAttributes {
        return {
            userId: this.userId,
            lastContactedAt: this.lastContactedAt
        }
    }
}
