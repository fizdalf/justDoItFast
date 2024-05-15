export class GameSessionPlayerLeftEvent {
    constructor(public readonly gameSessionId: string, public readonly playerId: string) {
    }
}
