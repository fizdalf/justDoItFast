import {GameWaitingRoomSqlGetter} from "./infrastructure/persistence/game-waiting-room-sql.getter";
import {GameWaitingRoomGetter} from "./domain/services/game-waiting-room.getter";
import {Module} from "@nestjs/common";
import {GetCurrentRoomQueryHandler} from "./application/get-game-waiting-room/get-game-waiting-room.query-handler";
import {GetGameWaitingRoomController} from "./infrastructure/http/controller/get-game-waiting-room/get-game-waiting-room.controller";
import {SharedModule} from "../shared/infrastructure/shared.module";

const QUERY_HANDLERS = [
    GetCurrentRoomQueryHandler,
]

const CONTROLLERS = [
    GetGameWaitingRoomController,
]


@Module({
    imports: [
        SharedModule,
    ],
    controllers: [
        ...CONTROLLERS,
    ],
    providers: [
        ...QUERY_HANDLERS,
        {
            provide: GameWaitingRoomGetter,
            useClass: GameWaitingRoomSqlGetter,
        },
    ],
})
export class GameSessionModule {
}