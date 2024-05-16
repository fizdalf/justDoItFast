export class GameSessionHostChangedEvent {
    constructor(
        public readonly gameSessionId: string,
        public readonly newHostId: string,
    ) {
    }
}
