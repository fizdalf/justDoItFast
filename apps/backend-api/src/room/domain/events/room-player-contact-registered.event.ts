import {DomainEvent} from "../../../shared/domain/domain-event";

export class RoomPlayerContactRegisteredEvent implements DomainEvent {
    constructor(
        public readonly roomId: string,
        public readonly playerId: string,
        public readonly lastContactedAt: string,
        public readonly dateTimeOccurred: Date = new Date(),
    ) {
    }

    getAggregateId(): string {
        return this.roomId;
    }
}
