import {SessionEvent} from './session.event';
import {SessionEventType} from './session-event.type';

export class SessionLeftEvent implements SessionEvent {
    type: SessionEventType = 'session.left';

    constructor(
        public sessionId: string,
        public playerId: string,
    ) {
    }

    static fromPrimitives(primitives: any): SessionEvent {
        return new this(
            primitives['sessionId'],
            primitives['playerId'],
        );
    }

    toPrimitives(): object {
        return {
            type: this.type,
            sessionId: this.sessionId,
            playerId: this.playerId,
        };
    }
}
