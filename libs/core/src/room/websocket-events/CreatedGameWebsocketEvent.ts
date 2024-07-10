import {WebsocketEvent} from '@org/core/room/websocket-events/WebsocketEvent';

export interface CreatedGameWebsocketEventPayload {
}

export class CreatedGameWebsocketEvent extends WebsocketEvent<CreatedGameWebsocketEventPayload> {
    protected static override _eventName = 'game.created';


    constructor() {
        super();

    }

    payload(): CreatedGameWebsocketEventPayload {
        return {};
    }
}

