import {WebsocketEvent} from '@org/core/room/websocket-events/WebsocketEvent';

export interface UserJoinedRoomEventPayload {
    userName: string;
}

export class UserJoinedRoomEvent extends WebsocketEvent<UserJoinedRoomEventPayload> {
    protected static override _eventName = 'room.user-joined';
    private readonly userName: string;

    constructor(userName: string) {
        super();
        this.userName = userName;
    }

    payload(): UserJoinedRoomEventPayload {
        return {userName: this.userName};
    }
}

