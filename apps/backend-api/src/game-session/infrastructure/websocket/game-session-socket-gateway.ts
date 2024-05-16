import {ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {Injectable} from '@nestjs/common';
import {AuthenticationService} from '../authentication/AuthenticationService';
import {PlayerJoinedGameSessionEvent} from '@org/core/game-session/websocket-events/PlayerJoinedGameSessionEvent';
import {
    LoginWebsocketEvent,
    LoginWebsocketEventPayload
} from '@org/core/game-session/websocket-events/LoginWebsocketEvent';
import {
    PingWebsocketEvent,
    PingWebsocketEventAckPayload,
    PingWebsocketEventPayload
} from '@org/core/game-session/websocket-events/PingWebsocketEvent';
import {CommandBus} from '@nestjs/cqrs';
import {RegisterPlayerContactCommand} from '../../domain/commands/register-player-contact.command';
import {PlayerLeftGameSessionEvent} from '@org/core/game-session/websocket-events/PlayerLeftGameSessionEvent';


@WebSocketGateway({cors: {origin: '*'}})
@Injectable()
export class GameSessionSocketGateway {
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
            client.join(resp.gameSessionId);
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
            await this.commandBus.execute(new RegisterPlayerContactCommand(decodedToken.playerId, decodedToken.gameSessionId));
        } catch (e) {
            console.error(e);
            return {status: 'error', message: 'Could not register player contact'};
        }
        const refreshedToken = this.authService.refreshToken(decodedToken);
        return {status: 'ok', token: refreshedToken};
    }

    async informPlayerJoined(gameSessionId: string, playerName: string) {
        const event = new PlayerJoinedGameSessionEvent(playerName);
        this.server.to(gameSessionId).emit(PlayerJoinedGameSessionEvent.eventName(), event.payload());
    }

    async informPlayerLeft(gameSessionId: string, playerName: any) {
        console.log('informing player left', playerName, gameSessionId);
        const event = new PlayerLeftGameSessionEvent(playerName);
        this.server.to(gameSessionId).emit(PlayerLeftGameSessionEvent.eventName(), event.payload());
    }
}
