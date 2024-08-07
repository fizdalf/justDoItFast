import {GameSessionRepository} from "../../../../room/domain/repositories/game-session.repository";
import {InjectClient} from "nest-mysql";
import {Connection} from "mysql2/promise";
import {GameSession} from "../../../domain/entities/GameSession";
import {EventBus, IEvent, IEventBus} from "@nestjs/cqrs";
import {Inject} from "@nestjs/common";
import {DomainEvent} from "../../../../shared/domain/domain-event";
import {GameSessionCreatedEvent} from "../../../domain/events/game-session-created.event";

export class GameSessionSqlRepository implements GameSessionRepository {
    constructor(
        @InjectClient() private readonly pool: Connection,
        @Inject(EventBus) private readonly eventBus: IEventBus
    ) {
    }

    async save(gameSession: GameSession): Promise<void> {
        gameSession.publish = (event: IEvent) => this.eventBus.publish(event);
        gameSession.publishAll = (events: IEvent[]) => this.eventBus.publishAll(events);

        const events = gameSession.getUncommittedEvents();
        await this.pool.beginTransaction();

        try {
            await this.saveEvents(events);
            await this.pool.commit();
            gameSession.commit();
        } catch (error) {
            await this.pool.rollback();
            throw error;
        }
    }

    private async saveEvents(events: IEvent[]) {
        for (const event of events) {
            if (!DomainEvent.isDomainEvent(event)) {
                continue;
            }

            switch (event.eventName) {
                case GameSessionCreatedEvent.EVENT_NAME: {
                    const gameSessionCreatedEvent = event as GameSessionCreatedEvent;
                    await this.pool.execute(
                        `INSERT INTO game_session (id, room_id, status)
                         VALUES (?, ?, ?)`,
                        [
                            gameSessionCreatedEvent.aggregateId,
                            gameSessionCreatedEvent.roomId,
                            gameSessionCreatedEvent.status,
                        ]
                    );
                    await this.pool.execute(
                        `INSERT INTO game_session_seat (game_session_id, idx, player_name, player_user_id)
                         VALUES ${gameSessionCreatedEvent.seats.map(seat => `(?, ?, ?, ?)`).join(',')}`,
                        gameSessionCreatedEvent.seats.flatMap(seat => [gameSessionCreatedEvent.aggregateId, seat.index, seat.playerName, seat.playerUserId])
                    );
                    // await this.pool.execute(
                    //     `INSERT INTO game_session_word_pack (game_session_id, word_pack_id)
                    //      VALUES ${gameSessionCreatedEvent.wordPackIds.map(wordPackId => `(?, ?)`).join(',')}`,
                    //     gameSessionCreatedEvent.wordPackIds.map(wordPackId => [gameSessionCreatedEvent.aggregateId, wordPackId])
                    // );
                    break;
                }
            }
        }
    }
}
