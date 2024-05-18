export class RoomPlayerJoinedEvent {
    constructor(
        public readonly roomId: string,
        public readonly playerId: string,
        public readonly playerName: string,
        public readonly teamId: string,
    ) {
    }
}
