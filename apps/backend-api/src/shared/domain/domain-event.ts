import {UuidValueObject} from "@org/core/shared/domain/UuidValueObject";

export abstract class DomainEvent {
    static readonly EVENT_NAME: string;

    static fromPrimitives: (params: {
        aggregateId: string;
        eventId: string;
        occurredOn: Date;
        attributes: DomainEventAttributes;
    }) => DomainEvent;

    readonly aggregateId: string;
    readonly eventId: string;
    readonly occurredOn: Date;
    readonly eventName: string;

    protected constructor(params: { eventName: string, aggregateId: string, eventId?: string, occurredOn?: Date }) {
        const {aggregateId, eventName, eventId, occurredOn} = params
        this.aggregateId = aggregateId
        this.eventId = eventId || UuidValueObject.random().value
        this.occurredOn = occurredOn || new Date()
        this.eventName = eventName
    }

    static isDomainEvent(event: any): event is DomainEvent {
        return event instanceof DomainEvent;
    }

    abstract toPrimitives(): DomainEventAttributes;
}


type DomainEventAttributes = any;
