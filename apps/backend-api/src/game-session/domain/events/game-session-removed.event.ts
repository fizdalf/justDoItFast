import {IEvent} from '@nestjs/cqrs';

export class GameSessionRemovedDomainEvent implements IEvent {
    constructor(public readonly sessionId: string) {
    }
}
