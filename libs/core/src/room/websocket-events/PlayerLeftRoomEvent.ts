import {WebsocketEvent} from '@org/core/room/websocket-events/WebsocketEvent';


export interface PlayerLeftRoomEventPayload {
    playerName: string;
}

export class PlayerLeftRoomEvent extends WebsocketEvent<PlayerLeftRoomEventPayload> {
    protected static override _eventName = 'player-left-room-room';
    private readonly playerName: string;

    constructor(playerName: string) {
        super();
        this.playerName = playerName;
    }

    override payload(): PlayerLeftRoomEventPayload {
        return {
            playerName: this.playerName
        };
    }
}
