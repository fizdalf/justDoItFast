export class RoomPlayerLeftEvent {
    constructor(public readonly roomId: string, public readonly playerId: string) {
    }
}
