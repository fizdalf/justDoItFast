export class GameSessionPlayerContactRegisteredEvent {
    constructor(
        public readonly playerId: string,
        public readonly sessionId: string,
        public readonly lastContactedAt: string,
    ) {
    }
}
