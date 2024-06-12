import {DomainEvent} from "../../../shared/domain/domain-event";

type RoomCreatedEventAttributes = {
    readonly hostId: string;
    readonly hostName: string;
}

interface ConstructorParams {
    aggregateId: string;
    hostId: string;
    hostName: string;
    occurredOn?: Date;
    eventId?: string;
}

export class RoomCreatedEvent extends DomainEvent {
    static readonly EVENT_NAME: string = "room.created";

    readonly hostId: string;
    readonly hostName: string;
    readonly hostTeamId: string;
    readonly otherTeamId: string;

    constructor(
        {aggregateId, hostId, hostName, occurredOn, eventId}: ConstructorParams
    ) {
        super({
            eventName: RoomCreatedEvent.EVENT_NAME,
            aggregateId: aggregateId,
            occurredOn: occurredOn,
            eventId: eventId
        });
        this.hostName = hostName;
        this.hostId = hostId;
    }

    static fromPrimitives(params: {
        aggregateId: string
        attributes: RoomCreatedEventAttributes
        eventId: string
        occurredOn: Date
    }): DomainEvent {
        const {aggregateId, attributes, occurredOn, eventId} = params
        return new RoomCreatedEvent({
            aggregateId,
            hostId: attributes.hostId,
            hostName: attributes.hostName,
            eventId,
            occurredOn
        });
    }

    toPrimitives(): RoomCreatedEventAttributes {
        return {
            hostId: this.hostId,
            hostName: this.hostName,
        }
    }
}
