export class GameSessionPlayerJoinedEvent {
    constructor(
        public readonly gameSessionId: string,
        public readonly playerId: string,
        public readonly playerName: string,
        public readonly teamId: string,
    ) {
    }
}
