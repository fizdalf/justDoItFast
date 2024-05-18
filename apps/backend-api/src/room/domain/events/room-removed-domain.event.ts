import {IEvent} from '@nestjs/cqrs';

export class RoomRemovedDomainEvent implements IEvent {
    constructor(public readonly sessionId: string) {
    }
}
