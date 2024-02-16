import {SessionEvent} from './session.event';
import {SessionJoinedEvent} from './session-joined.event';
import {SessionCreatedEvent} from './session-created.event';

export class EventFactory {
    static fromRawEvent(rawEvent: any): SessionEvent {
        switch (rawEvent.type) {
            case 'session.joined':
                return SessionJoinedEvent.fromPrimitives(rawEvent);
            case 'session.created':
                return SessionCreatedEvent.fromPrimitives(rawEvent);
            default:
                throw new Error('Unknown event type');
        }
    }
}
