import {Module} from "@nestjs/common";
import {CreateGameSessionCommandHandler} from './application/create-game-session/create-game-session.command-handler';
import {CreateGameSessionController} from './infrastructure/http/controller/create-game-session.controller';
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

const commandHandlers = [
    CreateGameSessionCommandHandler,
];
const queryHandlers = [
    GetCurrentSessionQueryHandler,
];

@Module({
    imports: [
        CqrsModule,
        SharedModule,
    ],
    controllers: [
        CreateGameSessionController,
        GetCurrentSessionController,
    ],
    providers: [
        ...commandHandlers,
        ...queryHandlers,
        AuthenticationService,
        {
            provide: GameSessionRepository,
            useClass: GameSessionSqlRepository
        },
        {
            provide: CurrentGameSessionGetter,
            useClass: CurrentGameSessionMysqlGetter
        },
        GameSessionSocketGateway
    ]
})
export class GameSessionModule {

}
