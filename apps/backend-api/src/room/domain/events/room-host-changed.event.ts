import {DomainEvent} from "../../../shared/domain/domain-event";

export class RoomHostChangedEvent implements DomainEvent {
    constructor(
        public readonly roomId: string,
        public readonly newHostId: string,
        public readonly dateTimeOccurred: Date = new Date()
    ) {
    }

    getAggregateId(): string {
        return this.roomId;
    }
}
