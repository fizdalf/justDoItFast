import {GameSessionRepository} from '../../../domain/repositories/game-session.repository';

import {GameSession} from '../../../domain/aggregateRoots/GameSession';
import {Connection, RowDataPacket} from 'mysql2/promise';
import {Inject, Injectable} from '@nestjs/common';
import {InjectClient} from 'nest-mysql';
import {GameSessionId} from '../../../domain/valueObjects/GameSessionId';
import {PlayerId} from '../../../domain/valueObjects/PlayerId';
import {Player} from '../../../domain/entities/Player';
import {PlayerName} from '../../../domain/valueObjects/PlayerName';
import {Team} from '../../../domain/entities/Team';
import {PlayerLastContactedAt} from '../../../domain/valueObjects/playerLastContactedAt';
import {TeamId} from '../../../domain/valueObjects/TeamId';
import {EventBus, IEventBus} from '@nestjs/cqrs';
import {GameSessionCreatedDomainEvent} from '../../../domain/events/game-session-created.event';
import {GameSessionPlayerJoinedEvent} from '../../../domain/events/game-session-player-joined.event';
import {GameSessionPlayerLeftEvent} from '../../../domain/events/game-session-player-left.event';
import {GameSessionHostChangedEvent} from '../../../domain/events/game-session-host-changed-event';
import {
    GameSessionPlayerContactRegisteredEvent
} from '../../../domain/events/game-session-player-contact-registered.event';

export interface GameSessionRow extends RowDataPacket {
    id: string;
    host_id: string;
    created_at: Date;
    updated_at: Date;
}

class GameSessionNotFoundException extends Error {
    constructor(id: GameSessionId) {
        super(`Game session with id ${id.value} not found`);
    }
}

export class PersistableTeam extends Team {
    constructor(
        public readonly id: TeamId,
        public readonly players: Player[],
    ) {
        super(id, players);
    }
}

@Injectable()
export class GameSessionSqlRepository implements GameSessionRepository {

    constructor(
        @InjectClient() private readonly pool: Connection,
        @Inject(EventBus) private readonly eventBus: IEventBus
    ) {

    }

    async remove(id: GameSessionId): Promise<void> {
        await this.pool.beginTransaction();
        try {
            await this.pool.execute(
                'delete game_session, team, team_player from game_session left join team on team.game_session_id = game_session.id left join team_player on team_player.team_id = team.id  where game_session.id = ?',
                [
                    id.value,
                ]
            );
        } catch (error) {
            await this.pool.rollback();
            throw error;
        }
        await this.pool.commit();
    }

    async findOneById(id: GameSessionId): Promise<GameSession> {

        const [rows] = await this.pool.query<GameSessionRow[]>('select * from game_session where id = ?', [
            id.value,
        ]);
        if (rows.length == 0) {
            throw new GameSessionNotFoundException(id)
        }

        const row = rows[0];

        const teams = await this.getTeams(id)

        return new GameSession({
            id: GameSessionId.fromValue(row.id),
            host: PlayerId.fromValue(row.host_id),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            teams: teams,
        });

    }


    async save(gameSession: GameSession): Promise<void> {

        const events = gameSession.getUncommittedEvents();
        await this.pool.beginTransaction();

        try {
            for (const event of events) {
                switch (event.constructor.name) {

                    case GameSessionCreatedDomainEvent.name:
                        await this.insert(gameSession)
                        break;
                    case GameSessionPlayerJoinedEvent.name:
                        const playerJoinedEvent = event as GameSessionPlayerJoinedEvent;
                        await this.pool.execute('INSERT INTO team_player (player_id, team_id, name, last_contacted_at) VALUES (?, ?, ?, ?)', [
                            playerJoinedEvent.playerId,
                            playerJoinedEvent.teamId,
                            playerJoinedEvent.playerName,
                            new Date(),
                        ]);
                        break;
                    case GameSessionPlayerLeftEvent.name:
                        const playerLeftEvent = event as GameSessionPlayerLeftEvent;
                        await this.pool.execute('delete from team_player where player_id = ?', [
                            playerLeftEvent.playerId,
                        ]);
                        break;
                    case GameSessionHostChangedEvent.name:
                        const hostChangedEvent = event as GameSessionHostChangedEvent;
                        await this.pool.execute('update game_session set host_id = ? where id = ?', [
                            hostChangedEvent.newHostId,
                            hostChangedEvent.gameSessionId,
                        ]);
                        break;
                    case GameSessionPlayerContactRegisteredEvent.name:
                        const playerContactRegisteredEvent = event as GameSessionPlayerContactRegisteredEvent;
                        await this.pool.execute('update team_player set last_contacted_at = ? where player_id = ?', [
                            new Date(playerContactRegisteredEvent.lastContactedAt),
                            playerContactRegisteredEvent.playerId,
                        ]);
                        break;
                }

            }
        } catch (error) {
            await this.pool.rollback();
            throw error;
        }
        await this.pool.commit();

        this.eventBus.publishAll(events);

    }

    private async getTeams(id: GameSessionId) {
        const [rows] = await this.pool.query<RowDataPacket[]>('select * from team where game_session_id = ?', [
            id.value,
        ]);

        const teams = [];

        for (const row of rows) {
            const team = new Team(
                TeamId.fromValue(row.id),
                await this.getPlayers(row.id),
            );
            teams.push(team);
        }

        return teams;
    }

    private async getPlayers(id: any) {
        const [rows] = await this.pool.query<RowDataPacket[]>('select * from team_player where team_id = ?', [
            id,
        ]);

        const players = [];

        for (const row of rows) {
            const player = new Player(
                {
                    id: PlayerId.fromValue(row.player_id),
                    name: PlayerName.fromValue(row.name),
                    lastContactedAt: PlayerLastContactedAt.create(row.last_contacted_at),
                },
            );
            players.push(player);
        }

        return players;
    }

    private async insert(gameSession: GameSession) {

        await this.pool.execute('INSERT INTO game_session (id, host_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [
                gameSession.id.value,
                gameSession.host.value,
                gameSession.createdAt,
                gameSession.updatedAt,
            ]
        );
        for (const team of gameSession.teams) {
            await this.pool.execute('INSERT INTO team (id, game_session_id) VALUES (?, ?)', [
                team.id.value,
                gameSession.id.value,
            ]);

            for (const player of team.players) {
                const playerData = player as unknown as {
                    _id: PlayerId,
                    _name: PlayerName,
                    _lastContactedAt: PlayerLastContactedAt
                }

                await this.pool.execute('INSERT INTO team_player (player_id, team_id, name, last_contacted_at) VALUES (?, ?, ?, ?)', [
                    playerData._id.value,
                    team.id.value,
                    playerData._name.value,
                    playerData._lastContactedAt.value,
                ]);

            }
        }
    }
}
