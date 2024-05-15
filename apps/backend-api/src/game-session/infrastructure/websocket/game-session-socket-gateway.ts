import {
    ConnectedSocket,
    MessageBody,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {Injectable} from '@nestjs/common';
import {GameSessionToken} from '../../domain/valueObjects/GameSessionToken';
import {AuthenticationService} from '../authentication/AuthenticationService';
import {PlayerJoinedGameSessionEvent} from '@org/core/game-session/websocket-events/PlayerJoinedGameSessionEvent';
import {
    LoginWebsocketEvent,
    LoginWebsocketEventPayload
} from '@org/core/game-session/websocket-events/LoginWebsocketEvent';


@WebSocketGateway({cors: {origin: '*'}})
@Injectable()
export class GameSessionSocketGateway implements OnGatewayInit {
    @WebSocketServer() server: Server;

    constructor(private authService: AuthenticationService) {
    }

    afterInit(server: Server) {

    }

    @SubscribeMessage(LoginWebsocketEvent.eventName())
    async handleEvent(@MessageBody() payload: LoginWebsocketEventPayload, @ConnectedSocket() client: Socket): Promise<string> {
        const resp = await this.authService.validateToken(payload.token);
        const token = new GameSessionToken({
            gameSessionId: resp.gameSessionId,
            playerName: resp.playerName,
            playerId: resp.playerId,
            isHost: resp.isHost
        });
        client.join(token.gameSessionId);
        return 'ok';
    }

    async informPlayerJoined(gameSessionId: string, playerName: string) {
        const event = new PlayerJoinedGameSessionEvent(playerName);
        this.server.to(gameSessionId).emit(PlayerJoinedGameSessionEvent.eventName(), event.payload());
    }
}
