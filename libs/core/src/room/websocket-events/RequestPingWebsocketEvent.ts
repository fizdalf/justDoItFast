import {WebsocketEvent} from '@org/core/room/websocket-events/WebsocketEvent';

export interface RequestPingWebsocketEventPayload {

}

export class RequestPingWebsocketEvent extends WebsocketEvent<any> {
    protected static override _eventName: string = 'request-ping';

    constructor(private payloadValue: RequestPingWebsocketEventPayload) {
        super();
    }

    payload(): RequestPingWebsocketEventPayload {
        return this.payloadValue;
    }
}
