import {WebsocketEvent} from '@org/core/game-session/websocket-events/WebsocketEvent';

export interface PingWebsocketEventPayload {
    token: string;
}

export interface PingWebsocketEventAckOkPayload {
    status: 'ok';
    token: string;
}

export interface PingWebsocketEventAckErrorPayload {
    status: 'error';
    message: string;
}

export type PingWebsocketEventAckPayload = PingWebsocketEventAckOkPayload | PingWebsocketEventAckErrorPayload;


export class PingWebsocketEvent extends WebsocketEvent<PingWebsocketEventPayload> {
    protected static override _eventName: string = 'ping';

    constructor(private payloadValue: PingWebsocketEventPayload) {
        super();
    }

    payload(): PingWebsocketEventPayload {
        return this.payloadValue;
    }
}
