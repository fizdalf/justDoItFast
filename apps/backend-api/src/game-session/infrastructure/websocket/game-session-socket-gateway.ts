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


@WebSocketGateway({cors: {origin: '*'}})
@Injectable()
export class GameSessionSocketGateway implements OnGatewayInit {
    @WebSocketServer() server: Server;

    constructor() {
    }

    afterInit(server: Server) {

    }

    @SubscribeMessage('login')
    async handleEvent(@MessageBody() data: string, @ConnectedSocket() client: Socket): Promise<string> {
        console.log('login', data);
        return 'ok';
    }

}
