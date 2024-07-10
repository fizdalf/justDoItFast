import {WebsocketService} from '../websocket/websocket.service';
import {Injectable} from '@angular/core';
import {RequestPingWebsocketEvent} from '@org/core/room/websocket-events/RequestPingWebsocketEvent';
import {PingWebsocketEvent, PingWebsocketEventPayload} from '@org/core/room/websocket-events/PingWebsocketEvent';
import {
    LoginWebsocketEvent,
    LoginWebsocketEventAcknowledge,
    LoginWebsocketEventPayload
} from "@org/core/room/websocket-events/LoginWebsocketEvent";

const SESSION_STORAGE_KEY = 'roomToken';

@Injectable()
export class AuthenticationService {

    constructor(private websocketService: WebsocketService) {
        this.setupPing();
        this.setupLogin();
    }

    public async isAuthenticated(): Promise<boolean> {
        return !!sessionStorage.getItem(SESSION_STORAGE_KEY);
    }

    logout() {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }

    login(roomToken: string) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, roomToken);
    }

    async getToken() {
        return sessionStorage.getItem(SESSION_STORAGE_KEY);
    }

    private async setupPing() {
        this.websocketService.on(RequestPingWebsocketEvent.eventName()).subscribe(async () => {
            const token = await this.getToken();
            if (!token) {
                return;
            }
            this.websocketService.emit<PingWebsocketEventPayload>(PingWebsocketEvent.eventName(), {token});
        })
    }

    private async setupLogin() {
        this.websocketService.on('connect').subscribe(async () => {
            const token = await this.getToken();
            if (token) {
                const response = await this.websocketService.emitWithAcknowledge<LoginWebsocketEventPayload, LoginWebsocketEventAcknowledge>(LoginWebsocketEvent.eventName(), {token});
                if (response.type === 'error') {
                    this.logout();
                }
            }
        })
    }
}
