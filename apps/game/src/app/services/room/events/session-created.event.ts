import {SessionEvent} from './session.event';
import {SessionEventType} from './session-event.type';

export class SessionCreatedEvent implements SessionEvent {
    type: SessionEventType = 'session.created';

    constructor(public sessionId: string, public hostName: string) {
    }

    toPrimitives(): object {
        return {
            type: this.type,
            sessionId: this.sessionId,
            hostName: this.hostName,
        };
    }

    static fromPrimitives(primitives: any): SessionEvent {
        return new SessionCreatedEvent(
            primitives['sessionId'],
            primitives['hostName'],
        );
    }

}
