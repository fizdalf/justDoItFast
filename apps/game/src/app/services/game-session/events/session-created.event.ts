import {SessionEvent} from './session.event';
import {SessionEventType} from './session-event.type';
import {Icon} from '../icon';
import {SessionId} from '../SessionId';

export class SessionCreatedEvent implements SessionEvent {
    type: SessionEventType = 'session.created';

    constructor(public sessionId: SessionId, public hostIcon: Icon) {
    }

    toPrimitives(): object {
        return {
            type: this.type,
            sessionId: this.sessionId.value,
            hostIcon: this.hostIcon.name,
            hostIconUrl: this.hostIcon.url
        };
    }

    static fromPrimitives(primitives: any): SessionEvent {
        return new SessionCreatedEvent(
            new SessionId(primitives['sessionId']),
            {
                name: primitives['hostIcon'],
                url: primitives['hostIconUrl']
            }
        );
    }

}
