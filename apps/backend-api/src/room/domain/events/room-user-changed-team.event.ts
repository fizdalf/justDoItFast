import {DomainEvent} from "../../../shared/domain/domain-event";


type RoomUserChangedTeamEventAttributes = { userId: string, fromTeamId: string, toTeamId: string };

interface ConstructorParams {
    aggregateId: string;
    userId: string;
    fromTeamId: string;
    toTeamId: string;
    occurredOn?: Date;
    eventId?: string;
}

export class RoomUserChangedTeamEvent extends DomainEvent {
    static readonly EVENT_NAME: string = "room.user-changed-team";

    public readonly userId: string;

    public readonly fromTeamId: string;

    public readonly toTeamId: string;


    constructor({aggregateId, userId, fromTeamId, toTeamId, occurredOn, eventId}: ConstructorParams) {
        super({aggregateId, occurredOn, eventName: RoomUserChangedTeamEvent.EVENT_NAME, eventId});
        this.toTeamId = toTeamId;
        this.fromTeamId = fromTeamId;
        this.userId = userId;
    }

    static fromPrimitives(params: {
        aggregateId: string,
        eventId: string,
        occurredOn: Date,
        attributes: RoomUserChangedTeamEventAttributes
    }): DomainEvent {
        const {aggregateId, eventId, occurredOn, attributes} = params;
        return new RoomUserChangedTeamEvent({
            aggregateId: aggregateId,
            userId: attributes.userId,
            fromTeamId: attributes.fromTeamId,
            toTeamId: attributes.toTeamId,
            occurredOn: occurredOn,
            eventId: eventId
        });
    }

    toPrimitives(): RoomUserChangedTeamEventAttributes {
        return {
            userId: this.userId,
            fromTeamId: this.fromTeamId,
            toTeamId: this.toTeamId
        }
    }

}
