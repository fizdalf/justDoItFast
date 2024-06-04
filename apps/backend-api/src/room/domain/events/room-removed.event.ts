import {DomainEvent} from "../../../shared/domain/domain-event";

export class RoomRemovedEvent implements DomainEvent {
    constructor(
        public readonly roomId: string,
        public readonly dateTimeOccurred: Date = new Date()
    ) {
    }

    getAggregateId(): string {
        return this.roomId;
    }
}