import {SessionEventType} from './session-event.type';

export abstract class SessionEvent {
    protected constructor(public type: SessionEventType, public sessionId: string) {
        this.type = type;
        this.sessionId = sessionId;
    }

    abstract toPrimitives(): object;

}
