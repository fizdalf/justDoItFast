import {DomainEvent} from "../../../shared/domain/domain-event";

export class RoomPlayerJoinedEvent implements DomainEvent {
    constructor(
        public readonly roomId: string,
        public readonly playerId: string,
        public readonly playerName: string,
        public readonly teamId: string,
        public readonly dateTimeOccurred: Date = new Date(),
    ) {
    }

    getAggregateId(): string {
        return this.roomId;
    }
}
