import {ConsoleLogger, Module} from "@nestjs/common";
import {CreateRoomCommandHandler} from './application/create-room/create-room-command.handler';
import {CreateRoomController} from './infrastructure/http/controller/create-room/create-room.controller';
import {RoomMysqlRepository} from './infrastructure/persistence/repository/room-mysql.repository';
import {RoomRepository} from './domain/repositories/room.repository';
import {SharedModule} from '../shared/infrastructure/shared.module';
import {GetCurrentRoomController} from './infrastructure/http/controller/get-current-room/get-current-room.controller';
import {GetCurrentRoomQueryHandler} from './application/get-current-room/get-current-room.query-handler';
import {CurrentRoomGetter} from './domain/service/CurrentRoomGetter';
import {CurrentRoomMysqlGetter} from './infrastructure/persistence/current-room-mysql-getter.service';
import {RoomSocketGateway} from './infrastructure/websocket/room-socket-gateway.service';
import {GetRoomPreviewQueryHandler} from './application/get-room-preview/get-room-preview-query-handler.service';
import {GetRoomPreviewController} from './infrastructure/http/controller/get-room-preview/get-room-preview.controller';
import {JoinRoomController} from './infrastructure/http/controller/join-room/join-room.controller';
import {JoinRoomCommandHandler} from './application/join-room/join-room-command.handler';
import {OnRoomJoinedEventHandler} from './domain/event-listeners/on-room-joined-event.handler';
import {LeaveRoomCommandHandler} from './application/leave-room/leave-room-command.handler';
import {DisconnectIdlePlayersFromRoomTask} from './infrastructure/cron/disconnect-idle-players-from-room-task.service';
import {RequestIdlePlayersRemovalFromRoomCommandHandler} from './application/request-idle-player-removal-from-room/request-idle-players-removal-from-room-command.handler';
import {RoomsIdsGetter} from './domain/service/RoomsIdsGetter';
import {RoomsIdsMysqlGetter} from './infrastructure/persistence/rooms-ids-mysql-getter.service';
import {RegisterPlayerContactCommandHandler} from './application/register-player-contact/register-player-contact.command-handler';
import {OnRoomIdlePlayersRemovalRequestedEventListener} from './domain/event-listeners/on-room-idle-players-removal-requested-event.listener';
import {RemoveIdlePlayersFromRoomCommandHandler} from './application/remove-idle-players-from-room/remove-idle-players-from-room-command.handler';
import {OnRoomEmptiedEventListener} from './domain/event-listeners/on-room-emptied-event.listener';
import {OnRoomPlayerLeftEventHandler} from './domain/event-listeners/on-room-player-left-event.handler';
import {RemoveRoomCommandHandler} from './application/remove-room/remove-room-command.handler';
import {LeaveRoomController} from './infrastructure/http/controller/leave-room/leave-room-controller';
import {RoomPreviewService} from "./domain/service/RoomPreviewService";
import {RoomPreviewSqlService} from "./infrastructure/persistence/room-preview.sql.service";
import {CreateGameController} from "./infrastructure/http/controller/create-game/create-game.controller";
import {OnGameSessionCreatedEventHandler} from "./domain/event-listeners/on-game-session-created.event-handler";
import {CreateGameCommandHandler} from "./application/start-game/create-game-command.handler";
import {GameSessionRepository} from "./domain/repositories/game-session.repository";
import {GameSessionSqlRepository} from "../game-session/infrastructure/persistence/repository/game-session-sql.repository";
import {RegisterUserInWebSocketRoomCommandHandler} from "./application/register-user-in-web-socket-room/register-user-in-web-socket-room.command-handler";

const COMMAND_HANDLERS = [
    CreateRoomCommandHandler,
    JoinRoomCommandHandler,
    LeaveRoomCommandHandler,
    RequestIdlePlayersRemovalFromRoomCommandHandler,
    RegisterPlayerContactCommandHandler,
    RemoveIdlePlayersFromRoomCommandHandler,
    RemoveRoomCommandHandler,
    CreateGameCommandHandler,
    RegisterUserInWebSocketRoomCommandHandler,
];
const QUERY_HANDLERS = [
    GetCurrentRoomQueryHandler,
    GetRoomPreviewQueryHandler,
];
const EVENT_HANDLERS = [
    OnRoomJoinedEventHandler,
    OnRoomIdlePlayersRemovalRequestedEventListener,
    OnRoomEmptiedEventListener,
    OnRoomPlayerLeftEventHandler,
    OnGameSessionCreatedEventHandler,
];

const tasks = [
    DisconnectIdlePlayersFromRoomTask,
];

@Module({
    imports: [
        SharedModule,
    ],
    controllers: [
        CreateRoomController,
        GetCurrentRoomController,
        GetRoomPreviewController,
        JoinRoomController,
        LeaveRoomController,
        CreateGameController,
    ],
    providers: [
        ...COMMAND_HANDLERS,
        ...QUERY_HANDLERS,
        ...EVENT_HANDLERS,
        ...tasks,
        {
            provide: RoomRepository,
            useClass: RoomMysqlRepository,
        },
        {
            provide: CurrentRoomGetter,
            useClass: CurrentRoomMysqlGetter,
        },
        {
            provide: RoomsIdsGetter,
            useClass: RoomsIdsMysqlGetter,
        },
        {
            provide: RoomPreviewService,
            useClass: RoomPreviewSqlService,
        },
        {
            provide: GameSessionRepository,
            useClass: GameSessionSqlRepository,
        },
        RoomSocketGateway,
        ConsoleLogger,
    ]
})
export class RoomModule {

}
