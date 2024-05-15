import {WebsocketEvent} from '@org/core/game-session/websocket-events/WebsocketEvent';

export interface PlayerJoinedGameSessionEventPayload {
    playerName: string;
}

export class PlayerJoinedGameSessionEvent extends WebsocketEvent<PlayerJoinedGameSessionEventPayload> {
    protected static override _eventName = 'player-joined-game-session';
    private readonly playerName: string;

    constructor(playerName: string) {
        super();
        this.playerName = playerName;
    }

    payload(): PlayerJoinedGameSessionEventPayload {
        return {playerName: this.playerName};
    }
}

