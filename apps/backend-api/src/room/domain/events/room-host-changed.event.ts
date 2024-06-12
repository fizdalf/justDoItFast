import {DomainEvent} from "../../../shared/domain/domain-event";

interface ConstructorParams {
    aggregateId: string;
    newHostId: string;
    occurredOn?: Date;
    eventId?: string;
}

type RoomHostChangedEventAttributes = { newHostId: string };

export class RoomHostChangedEvent extends DomainEvent {
    static readonly EVENT_NAME: string = "room.host-changed";

    public readonly newHostId: string;

    constructor({aggregateId, newHostId, occurredOn, eventId}: ConstructorParams) {
        super({aggregateId, occurredOn, eventName: RoomHostChangedEvent.EVENT_NAME, eventId});
        this.newHostId = newHostId;
    }

    static fromPrimitives(params: {
        aggregateId: string,
        eventId: string,
        occurredOn: Date,
        attributes: RoomHostChangedEventAttributes
    }): DomainEvent {
        const {aggregateId, eventId, occurredOn, attributes} = params;
        return new RoomHostChangedEvent({
            aggregateId: aggregateId,
            newHostId: attributes.newHostId,
            occurredOn: occurredOn
        });
    }

    toPrimitives(): RoomHostChangedEventAttributes {
        return {
            newHostId: this.newHostId
        }
    }

}
