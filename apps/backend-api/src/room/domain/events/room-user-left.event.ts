import {DomainEvent} from "../../../shared/domain/domain-event";

type RoomPlayerLeftEventAttributes = { playerId: string };

export class RoomUserLeftEvent extends DomainEvent {
    static readonly EVENT_NAME: string = "room.user-left";

    public readonly userId: string;

    constructor(
        aggregateId: string,
        userId: string,
        occurredOn?: Date,
        eventId?: string
    ) {
        super({
            eventName: RoomUserLeftEvent.EVENT_NAME,
            aggregateId: aggregateId,
            occurredOn: occurredOn,
            eventId: eventId
        });
        this.userId = userId;
    }

    static fromPrimitives(params: {
        aggregateId: string,
        eventId: string,
        occurredOn: Date,
        attributes: RoomPlayerLeftEventAttributes
    }): DomainEvent {
        const {aggregateId, eventId, occurredOn, attributes} = params;
        return new RoomUserLeftEvent(aggregateId, attributes.playerId, occurredOn, eventId);
    }

    toPrimitives() {
        return {
            playerId: this.userId
        }
    }
}
