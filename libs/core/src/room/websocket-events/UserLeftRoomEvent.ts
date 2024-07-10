import {WebsocketEvent} from '@org/core/room/websocket-events/WebsocketEvent';


export interface UserLeftRoomEventPayload {
    userName: string;
}

export class UserLeftRoomEvent extends WebsocketEvent<UserLeftRoomEventPayload> {
    protected static override _eventName = 'room.user-left';
    private readonly userName: string;

    constructor(userName: string) {
        super();
        this.userName = userName;
    }

    override payload(): UserLeftRoomEventPayload {
        return {
            userName: this.userName
        };
    }
}
