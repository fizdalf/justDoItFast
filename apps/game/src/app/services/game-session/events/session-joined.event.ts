import {SessionEvent} from './session.event';
import {SessionEventType} from './session-event.type';
import {PlayerId} from '../player.id';
import {PlayerIcon} from '../PlayerIcon';
import {SessionId} from '../SessionId';

export class SessionJoinedEvent implements SessionEvent {
    type: SessionEventType = 'session.joined';

    constructor(
        public sessionId: SessionId,
        public playerId: PlayerId,
        public playerIcon: PlayerIcon
    ) {
    }

    static fromPrimitives(primitives: any): SessionEvent {
        return new SessionJoinedEvent(
            new SessionId(primitives['sessionId']),
            {value: primitives['playerId']},
            {name: primitives['playerIcon']}
        );
    }

    toPrimitives(): object {
        return {
            type: this.type,
            sessionId: this.sessionId.value,
            playerId: this.playerId.value,
            playerIcon: this.playerIcon.name
        };
    }
}
