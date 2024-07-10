import {WebsocketEvent} from '@org/core/room/websocket-events/WebsocketEvent';


export interface UserLeftRoomEventWebsocketPayload {
    userName: string;
}

export class UserLeftRoomWebsocketEvent extends WebsocketEvent<UserLeftRoomEventWebsocketPayload> {
    protected static override _eventName = 'room.user-left';
    private readonly userName: string;

    constructor(userName: string) {
        super();
        this.userName = userName;
    }

    override payload(): UserLeftRoomEventWebsocketPayload {
        return {
            userName: this.userName
        };
    }
}
