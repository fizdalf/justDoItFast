import {WebsocketEvent} from '@org/core/room/websocket-events/WebsocketEvent';

export interface LoginWebsocketEventPayload {
    token: string
}

export interface LoginWebsocketEventAcknowledge {
    type: 'error' | 'ok';
}

export class LoginWebsocketEvent extends WebsocketEvent<LoginWebsocketEventPayload> {
    protected static override _eventName = 'login';

    constructor(private readonly token: string) {
        super();

    }

    payload(): LoginWebsocketEventPayload {
        return {token: this.token};
    }

    acknowledge(): LoginWebsocketEventAcknowledge {
        return {type: 'ok'};
    }
}
