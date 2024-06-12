import {DomainEvent} from "../../../shared/domain/domain-event";

type RoomPlayerJoinedEventAttributes = {
    userId: string,
    userName: string,
};

interface ConstructorParams {
    aggregateId: string;
    userId: string;
    userName: string;
    occurredOn?: Date;
    eventId?: string;
}

export class RoomUserJoinedEvent extends DomainEvent {
    static readonly EVENT_NAME: string = "room.user-joined";

    public readonly userId: string;
    public readonly userName: string;

    constructor({aggregateId, userId, userName, occurredOn, eventId}: ConstructorParams) {
        super({aggregateId, occurredOn, eventId, eventName: RoomUserJoinedEvent.EVENT_NAME});

        this.userName = userName;
        this.userId = userId;
    }

    static fromPrimitives(params: {
        aggregateId: string,
        eventId: string,
        occurredOn: Date,
        attributes: RoomPlayerJoinedEventAttributes
    }): DomainEvent {
        const {aggregateId, eventId, occurredOn, attributes} = params;
        return new RoomUserJoinedEvent({
            aggregateId: aggregateId,
            userId: attributes.userId,
            userName: attributes.userName,
            occurredOn: occurredOn,
            eventId: eventId
        });
    }

    toPrimitives() {
        return {
            userId: this.userId,
            userName: this.userName,
        }
    }
}
