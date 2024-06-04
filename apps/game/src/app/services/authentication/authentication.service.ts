import {WebsocketService} from '../websocket/websocket.service';
import {Injectable} from '@angular/core';
import {RequestPingWebsocketEvent} from '@org/core/room/websocket-events/RequestPingWebsocketEvent';
import {PingWebsocketEvent, PingWebsocketEventPayload} from '@org/core/room/websocket-events/PingWebsocketEvent';
import {LoginWebsocketEvent, LoginWebsocketEventPayload} from "@org/core/room/websocket-events/LoginWebsocketEvent";

@Injectable()
export class AuthenticationService {

    constructor(private websocketService: WebsocketService) {
        this.setupPing();
        this.setupLogin();
    }

    public async isAuthenticated(): Promise<boolean> {
        return !!sessionStorage.getItem('roomToken');
    }

    logout() {
        sessionStorage.clear();
    }

    login(roomToken: string) {
        sessionStorage.setItem('roomToken', roomToken);
    }

    async getToken() {
        return sessionStorage.getItem('roomToken');
    }

    private async setupPing() {
        this.websocketService.on(RequestPingWebsocketEvent.eventName()).subscribe(async () => {
            console.log('ping requested');
            const token = await this.getToken();
            if (token) {
                this.websocketService.emit<PingWebsocketEventPayload>(PingWebsocketEvent.eventName(), {token});
            }
        })
    }

    private async setupLogin() {
        this.websocketService.on('connect').subscribe(async () => {
            console.log('connected event!');
            const token = await this.getToken();
            if (token) {
                this.websocketService.emit<LoginWebsocketEventPayload>(LoginWebsocketEvent.eventName(), {token});
            }
        })
    }
}
