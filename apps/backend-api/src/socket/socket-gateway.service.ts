import {
    MessageBody,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse
} from '@nestjs/websockets';
import {Observable, of} from 'rxjs';
import {Server} from 'socket.io';
import {Injectable} from '@nestjs/common';
import {SocketService} from './socket.service';

@WebSocketGateway({cors: {origin: '*'}})
@Injectable()
export class SocketGateway implements OnGatewayInit {
    @WebSocketServer() server: Server;

    constructor(private socketService: SocketService) {
    }

    afterInit(server: Server) {
        this.socketService.init(server);
    }

    @SubscribeMessage('events')
    handleEvent(@MessageBody() data: any): Observable<WsResponse<number>> {
        console.log(data);

        return of({event: 'events', data});
    }

}
