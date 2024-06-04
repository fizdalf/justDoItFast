import {DomainEvent} from "../../../shared/domain/domain-event";

export class RoomGameSessionCreatedEvent implements DomainEvent {


    constructor(
        public readonly roomId: string,
        public readonly gameSessionId: string,
        public readonly dateTimeOccurred: Date = new Date()
    ) {

    }

    getAggregateId(): string {
        return this.roomId;
    }
}
