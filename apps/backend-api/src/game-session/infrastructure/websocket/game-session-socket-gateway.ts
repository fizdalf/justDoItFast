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


@WebSocketGateway({cors: {origin: '*'}})
@Injectable()
export class GameSessionSocketGateway implements OnGatewayInit {
    @WebSocketServer() server: Server;

    constructor(private authService: AuthenticationService) {
    }

    afterInit(server: Server) {

    }

    @SubscribeMessage('login')
    async handleEvent(@MessageBody() authToken: string, @ConnectedSocket() client: Socket): Promise<string> {
        const resp = await this.authService.validateToken(authToken);
        const token = new GameSessionToken({
            gameSessionId: resp.gameSessionId,
            playerName: resp.playerName,
            playerId: resp.playerId,
            isHost: resp.isHost
        })
        console.log('gameSessionId', token.gameSessionId);

        client.join(token.gameSessionId);

        this.server.to(token.gameSessionId).emit('room-event', {someData: token.gameSessionId});

        return 'ok';
    }

    async informPlayerJoined(gameSessionId: string, playerName: string) {
        this.server.to(gameSessionId).emit('player-joined', {playerName});
    }
}
