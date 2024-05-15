
export class GameSessionCreatedDomainEvent {
    constructor(public readonly gameSessionId: string, public readonly hostId: string) {
    }
}
