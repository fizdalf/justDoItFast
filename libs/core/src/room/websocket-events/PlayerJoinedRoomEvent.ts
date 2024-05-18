import {WebsocketEvent} from '@org/core/room/websocket-events/WebsocketEvent';

export interface PlayerJoinedRoomEventPayload {
    playerName: string;
}

export class PlayerJoinedRoomEvent extends WebsocketEvent<PlayerJoinedRoomEventPayload> {
    protected static override _eventName = 'player-joined-room-room';
    private readonly playerName: string;

    constructor(playerName: string) {
        super();
        this.playerName = playerName;
    }

    payload(): PlayerJoinedRoomEventPayload {
        return {playerName: this.playerName};
    }
}

