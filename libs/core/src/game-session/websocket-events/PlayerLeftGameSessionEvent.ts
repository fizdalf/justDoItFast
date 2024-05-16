import {WebsocketEvent} from '@org/core/game-session/websocket-events/WebsocketEvent';


export interface PlayerLeftGameSessionEventPayload {
    playerName: string;
}

export class PlayerLeftGameSessionEvent extends WebsocketEvent<PlayerLeftGameSessionEventPayload> {
    protected static override _eventName = 'player-left-game-session';
    private readonly playerName: string;

    constructor(playerName: string) {
        super();
        this.playerName = playerName;
    }

    override payload(): PlayerLeftGameSessionEventPayload {
        return {
            playerName: this.playerName
        };
    }
}
