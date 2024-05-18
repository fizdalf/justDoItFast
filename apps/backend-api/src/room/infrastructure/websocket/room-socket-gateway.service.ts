import {ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {Injectable} from '@nestjs/common';
import {AuthenticationService} from '../authentication/AuthenticationService';
import {PlayerJoinedRoomEvent} from '@org/core/room/websocket-events/PlayerJoinedRoomEvent';
import {LoginWebsocketEvent, LoginWebsocketEventPayload} from '@org/core/room/websocket-events/LoginWebsocketEvent';
import {
    PingWebsocketEvent,
    PingWebsocketEventAckPayload,
    PingWebsocketEventPayload
} from '@org/core/room/websocket-events/PingWebsocketEvent';
import {CommandBus} from '@nestjs/cqrs';
import {RegisterPlayerContactCommand} from '../../domain/commands/register-player-contact.command';
import {PlayerLeftRoomEvent} from '@org/core/room/websocket-events/PlayerLeftRoomEvent';


@WebSocketGateway({cors: {origin: '*'}})
@Injectable()
export class RoomSocketGateway {
    @WebSocketServer() server: Server;

    constructor(
        private authService: AuthenticationService,
        private commandBus: CommandBus
    ) {
    }

    @SubscribeMessage(LoginWebsocketEvent.eventName())
    async handleEvent(@MessageBody() payload: LoginWebsocketEventPayload, @ConnectedSocket() client: Socket): Promise<string> {
        try {
            const resp = await this.authService.validateToken(payload.token);
            client.join(resp.roomId);
            return 'ok';
        } catch (e) {
            console.error(e);
            return 'error';
        }
    }

    @SubscribeMessage(PingWebsocketEvent.eventName())
    async handlePingEvent(@MessageBody() payload: PingWebsocketEventPayload): Promise<PingWebsocketEventAckPayload> {
        const decodedToken = await this.authService.validateToken(payload.token);
        try {
            await this.commandBus.execute(new RegisterPlayerContactCommand(decodedToken.playerId, decodedToken.roomId));
        } catch (e) {
            console.error(e);
            return {status: 'error', message: 'Could not register player contact'};
        }
        const refreshedToken = this.authService.refreshToken(decodedToken);
        return {status: 'ok', token: refreshedToken};
    }

    async informPlayerJoined(roomId: string, playerName: string) {
        const event = new PlayerJoinedRoomEvent(playerName);
        this.server.to(roomId).emit(PlayerJoinedRoomEvent.eventName(), event.payload());
    }

    async informPlayerLeft(roomId: string, playerName: any) {
        console.log('informing player left', playerName, roomId);
        const event = new PlayerLeftRoomEvent(playerName);
        this.server.to(roomId).emit(PlayerLeftRoomEvent.eventName(), event.payload());
    }
}
