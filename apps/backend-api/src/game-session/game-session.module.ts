import {ConsoleLogger, Module} from "@nestjs/common";
import {CreateGameSessionCommandHandler} from './application/create-game-session/create-game-session.command-handler';
import {
    CreateGameSessionController
} from './infrastructure/http/controller/create-game-session/create-game-session.controller';
import {CqrsModule} from '@nestjs/cqrs';
import {GameSessionSqlRepository} from './infrastructure/persistence/repository/game-session-sql.repository';
import {GameSessionRepository} from './domain/repositories/game-session.repository';
import {SharedModule} from '../shared/infrastructure/shared.module';
import {
    GetCurrentSessionController
} from './infrastructure/http/controller/get-current-session/get-current-session.controller';
import {AuthenticationService} from './infrastructure/authentication/AuthenticationService';
import {GetCurrentSessionQueryHandler} from './application/get-current-session/get-current-session.query-handler';
import {CurrentGameSessionGetter} from './domain/service/CurrentGameSessionGetter';
import {CurrentGameSessionMysqlGetter} from './infrastructure/persistence/CurrentGameSessionMysqlGetter';
import {GameSessionSocketGateway} from './infrastructure/websocket/game-session-socket-gateway';
import {
    GetGameSessionPreviewQueryHandler
} from './application/get-game-session-preview/get-game-session-preview.query-handler';
import {
    GetGameSessionPreviewController
} from './infrastructure/http/controller/get-session-preview/get-game-session-preview.controller';
import {JoinSessionController} from './infrastructure/http/controller/join-session/join-session.controller';
import {JoinGameSessionCommandHandler} from './application/join-game-session/join-game-session.command-handler';
import {OnGameSessionJoinedEventHandler} from './domain/event-listeners/on-game-session-joined.event-handler';
import {LeaveGameSessionCommandHandler} from './application/leave-game-session/leave-game-session.command-handler';
import {
    DisconnectIdlePlayersFromGameSessionTask
} from './infrastructure/cron/disconnect-idle-players-from-game-session.task';
import {
    RequestIdlePlayersRemovalFromGameSessionsCommandHandler
} from './application/request-idle-player-removal-from-game-sessions/request-idle-players-removal-from-game-sessions-command.handler';
import {GameSessionsIdsGetter} from './domain/service/GameSessionsIdsGetter';
import {GameSessionsIdsMysqlGetter} from './infrastructure/persistence/GameSessionsIdsMysqlGetter';
import {
    RegisterPlayerContactCommandHandler
} from './application/register-player-contact/register-player-contact.command-handler';
import {
    OnGameSessionIdlePlayersRemovalRequestedEventListener
} from './domain/event-listeners/on-game-session-idle-players-removal-requested.event-listener';
import {
    RemoveIdlePlayersFromGameSessionCommandHandler
} from './application/remove-idle-players-from-game-session/remove-idle-players-from-game-session.command-handler';
import {OnSessionEmptiedEventListener} from './domain/event-listeners/on-session-emptied.event-listener';
import {OnGameSessionPlayerLeftEventHandler} from './domain/event-listeners/on-game-session-player-left.event-handler';
import {RemoveSessionCommandHandler} from './application/remove-session/remove-session.command-handler';

const commandHandlers = [
    CreateGameSessionCommandHandler,
    JoinGameSessionCommandHandler,
    LeaveGameSessionCommandHandler,
    RequestIdlePlayersRemovalFromGameSessionsCommandHandler,
    RegisterPlayerContactCommandHandler,
    RemoveIdlePlayersFromGameSessionCommandHandler,
    RemoveSessionCommandHandler,
];
const queryHandlers = [
    GetCurrentSessionQueryHandler,
    GetGameSessionPreviewQueryHandler,
];
const eventHandlers = [
    OnGameSessionJoinedEventHandler,
    OnGameSessionIdlePlayersRemovalRequestedEventListener,
    OnSessionEmptiedEventListener,
    OnGameSessionPlayerLeftEventHandler,
];

const tasks = [
    DisconnectIdlePlayersFromGameSessionTask,
];

@Module({
    imports: [
        CqrsModule,
        SharedModule,
    ],
    controllers: [
        CreateGameSessionController,
        GetCurrentSessionController,
        GetGameSessionPreviewController,
        JoinSessionController,
    ],
    providers: [
        ...commandHandlers,
        ...queryHandlers,
        ...eventHandlers,
        ...tasks,
        AuthenticationService,
        {
            provide: GameSessionRepository,
            useClass: GameSessionSqlRepository,
        },
        {
            provide: CurrentGameSessionGetter,
            useClass: CurrentGameSessionMysqlGetter,
        },
        {
            provide: GameSessionsIdsGetter,
            useClass: GameSessionsIdsMysqlGetter,
        },
        GameSessionSocketGateway,
        ConsoleLogger,
    ]
})
export class GameSessionModule {

}
