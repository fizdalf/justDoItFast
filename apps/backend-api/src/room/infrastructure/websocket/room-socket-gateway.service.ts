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
import {AuthenticationService} from '../../../shared/infrastructure/authentication/authentication.service';
import {UserJoinedRoomWebsocketEvent} from '@org/core/room/websocket-events/UserJoinedRoomWebsocketEvent';
import {
    LoginWebsocketEvent,
    LoginWebsocketEventAcknowledge,
    LoginWebsocketEventPayload
} from '@org/core/room/websocket-events/LoginWebsocketEvent';
import {
    PingWebsocketEvent,
    PingWebsocketEventAckPayload,
    PingWebsocketEventPayload
} from '@org/core/room/websocket-events/PingWebsocketEvent';
import {CommandBus} from '@nestjs/cqrs';
import {RegisterPlayerContactCommand} from '../../domain/commands/register-player-contact.command';
import {UserLeftRoomWebsocketEvent} from '@org/core/room/websocket-events/UserLeftRoomWebsocketEvent';
import {RequestPingWebsocketEvent} from '@org/core/room/websocket-events/RequestPingWebsocketEvent';
import {RoomId} from "../../domain/value-objects/RoomId";
import {UserId} from "../../domain/value-objects/UserId";
import {CreatedGameWebsocketEvent} from "@org/core/room/websocket-events/CreatedGameWebsocketEvent";
import {RegisterUserInWebsocketCommand} from "../../domain/commands/register-user-in-web-socket-room.command";


@WebSocketGateway({cors: {origin: '*'}})
@Injectable()
export class RoomSocketGateway implements OnGatewayInit {
    @WebSocketServer() server: Server;

    constructor(
        private authService: AuthenticationService,
        private commandBus: CommandBus
    ) {
    }

    async afterInit(server: Server): Promise<any> {
        setInterval(async () => {
                server.emit(RequestPingWebsocketEvent.eventName(), {});
            },
            1000 * 30
        );
    }

    @SubscribeMessage(LoginWebsocketEvent.eventName())
    async handleEvent(@MessageBody() payload: LoginWebsocketEventPayload, @ConnectedSocket() client: Socket): Promise<LoginWebsocketEventAcknowledge> {
        try {
            const resp = await this.authService.validateToken(payload.token);
            // we want to validate that the room still exists...otherwise we should not allow the player to join
            await this.commandBus.execute(new RegisterUserInWebsocketCommand(UserId.fromValue(resp.playerId), RoomId.fromValue(resp.roomId), client));
            return {type: 'ok'};
        } catch (e) {
            // console.error(e);
            return {type: 'error'};
        }
    }

    @SubscribeMessage(PingWebsocketEvent.eventName())
    async handlePingEvent(@MessageBody() payload: PingWebsocketEventPayload): Promise<PingWebsocketEventAckPayload> {
        const decodedToken = await this.authService.validateToken(payload.token);
        try {
            await this.commandBus.execute(new RegisterPlayerContactCommand(UserId.fromValue(decodedToken.playerId), RoomId.fromValue(decodedToken.roomId)));
        } catch (e) {
            return {status: 'error', message: 'Could not register player contact'};
        }
        const refreshedToken = this.authService.refreshToken(decodedToken);
        return {status: 'ok', token: refreshedToken};
    }

    async informPlayerJoined(roomId: string, playerName: string) {
        const event = new UserJoinedRoomWebsocketEvent(playerName);
        this.server.to(roomId).emit(UserJoinedRoomWebsocketEvent.eventName(), event.payload());
    }

    async informPlayerLeft(roomId: string, playerName: any) {
        console.log('informing player left', playerName, roomId);
        const event = new UserLeftRoomWebsocketEvent(playerName);
        this.server.to(roomId).emit(UserLeftRoomWebsocketEvent.eventName(), event.payload());
    }

    async informGameSessionCreated({roomId, gameSessionId}: { roomId: string, gameSessionId: string }) {
        this.server.to(roomId).emit(CreatedGameWebsocketEvent.eventName(), {});
    }
}
