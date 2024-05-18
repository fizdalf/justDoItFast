import {SessionEvent} from './session.event';
import {SessionEventType} from './session-event.type';

export class SessionJoinedEvent implements SessionEvent {
    type: SessionEventType = 'session.joined';

    constructor(
        public sessionId: string,
        public playerId: string,
        public playerName: string
    ) {
    }

    static fromPrimitives(primitives: any): SessionEvent {
        return new SessionJoinedEvent(
            primitives['sessionId'],
            primitives['playerId'],
            primitives['playerName']
        );
    }

    toPrimitives(): object {
        return {
            type: this.type,
            sessionId: this.sessionId,
            playerId: this.playerId,
            playerName: this.playerName
        };
    }
}
