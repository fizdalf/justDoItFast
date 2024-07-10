import {WebsocketEvent} from '@org/core/room/websocket-events/WebsocketEvent';

export interface UserJoinedRoomWebsocketEventPayload {
    userName: string;
}

export class UserJoinedRoomWebsocketEvent extends WebsocketEvent<UserJoinedRoomWebsocketEventPayload> {
    protected static override _eventName = 'room.user-joined';
    private readonly userName: string;

    constructor(userName: string) {
        super();
        this.userName = userName;
    }

    payload(): UserJoinedRoomWebsocketEventPayload {
        return {userName: this.userName};
    }
}

