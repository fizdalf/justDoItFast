import {GameSessionRepository} from "../../../domain/repositories/game-session.repository";
import {InjectClient} from "nest-mysql";
import {Connection} from "mysql2/promise";
import {GameSession} from "../../../domain/aggregateRoots/GameSession";
import {EventBus, IEventBus} from "@nestjs/cqrs";
import {Inject} from "@nestjs/common";

export class GameSessionSqlRepository implements GameSessionRepository {
    constructor(
        @InjectClient() private readonly pool: Connection,
        @Inject(EventBus) private readonly eventBus: IEventBus
    ){}

    async save(gameSession: GameSession): Promise<void> {

        const events = gameSession.getUncommittedEvents();
    }
}
