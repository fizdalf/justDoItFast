
export class RoomCreatedDomainEvent {
    constructor(public readonly roomId: string, public readonly hostId: string) {
    }
}
