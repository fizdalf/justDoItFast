import {SessionEventType} from './session-event.type';
import {SessionId} from '../SessionId';

export abstract class SessionEvent {
    protected constructor(public type: SessionEventType, public sessionId: SessionId) {
        this.type = type;
        this.sessionId = sessionId;
    }

    abstract toPrimitives(): object;

}
