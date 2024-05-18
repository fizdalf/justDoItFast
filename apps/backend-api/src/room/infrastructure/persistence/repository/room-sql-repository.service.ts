import {RoomRepository} from '../../../domain/repositories/room.repository';

import {Room} from '../../../domain/aggregateRoots/Room';
import {Connection, RowDataPacket} from 'mysql2/promise';
import {Inject, Injectable} from '@nestjs/common';
import {InjectClient} from 'nest-mysql';
import {RoomId} from '../../../domain/valueObjects/RoomId';
import {PlayerId} from '../../../domain/valueObjects/PlayerId';
import {Player} from '../../../domain/entities/Player';
import {PlayerName} from '../../../domain/valueObjects/PlayerName';
import {Team} from '../../../domain/entities/Team';
import {PlayerLastContactedAt} from '../../../domain/valueObjects/playerLastContactedAt';
import {TeamId} from '../../../domain/valueObjects/TeamId';
import {EventBus, IEventBus} from '@nestjs/cqrs';
import {RoomCreatedDomainEvent} from '../../../domain/events/room-created-domain.event';
import {RoomPlayerJoinedEvent} from '../../../domain/events/room-player-joined.event';
import {RoomPlayerLeftEvent} from '../../../domain/events/room-player-left.event';
import {RoomHostChangedEvent} from '../../../domain/events/room-host-changed-event';
import {RoomPlayerContactRegisteredEvent} from '../../../domain/events/room-player-contact-registered.event';

export interface RoomRow extends RowDataPacket {
    id: string;
    host_id: string;
    created_at: Date;
    updated_at: Date;
}

class RoomNotFoundException extends Error {
    constructor(id: RoomId) {
        super(`Room with id ${id.value} not found`);
    }
}

@Injectable()
export class RoomSqlRepository implements RoomRepository {

    constructor(
        @InjectClient() private readonly pool: Connection,
        @Inject(EventBus) private readonly eventBus: IEventBus
    ) {

    }

    async remove(id: RoomId): Promise<void> {
        await this.pool.beginTransaction();
        try {
            await this.pool.execute(
                'delete room, team, team_player from room left join team on team.room_id = room.id left join team_player on team_player.team_id = team.id  where room.id = ?',
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

    async findOneById(id: RoomId): Promise<Room> {

        const [rows] = await this.pool.query<RoomRow[]>('select * from room where id = ?', [
            id.value,
        ]);
        if (rows.length == 0) {
            throw new RoomNotFoundException(id)
        }

        const row = rows[0];

        const teams = await this.getTeams(id)

        return new Room({
            id: RoomId.fromValue(row.id),
            host: PlayerId.fromValue(row.host_id),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            teams: teams,
        });

    }


    async save(room: Room): Promise<void> {

        const events = room.getUncommittedEvents();
        await this.pool.beginTransaction();

        try {
            for (const event of events) {
                switch (event.constructor.name) {

                    case RoomCreatedDomainEvent.name:
                        await this.insert(room)
                        break;
                    case RoomPlayerJoinedEvent.name:
                        const playerJoinedEvent = event as RoomPlayerJoinedEvent;
                        await this.pool.execute('INSERT INTO team_player (id, team_id, name, last_contacted_at) VALUES (?, ?, ?, ?)', [
                            playerJoinedEvent.playerId,
                            playerJoinedEvent.teamId,
                            playerJoinedEvent.playerName,
                            new Date(),
                        ]);
                        break;
                    case RoomPlayerLeftEvent.name:
                        const playerLeftEvent = event as RoomPlayerLeftEvent;
                        await this.pool.execute('delete from team_player where id = ?', [
                            playerLeftEvent.playerId,
                        ]);
                        break;
                    case RoomHostChangedEvent.name:
                        const hostChangedEvent = event as RoomHostChangedEvent;
                        await this.pool.execute('update room set host_id = ? where id = ?', [
                            hostChangedEvent.newHostId,
                            hostChangedEvent.roomId,
                        ]);
                        break;
                    case RoomPlayerContactRegisteredEvent.name:
                        const playerContactRegisteredEvent = event as RoomPlayerContactRegisteredEvent;
                        await this.pool.execute('update team_player set last_contacted_at = ? where id = ?', [
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

    private async getTeams(id: RoomId) {
        const [rows] = await this.pool.query<RowDataPacket[]>('select * from team where room_id = ?', [
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
                    id: PlayerId.fromValue(row.id),
                    name: PlayerName.fromValue(row.name),
                    lastContactedAt: PlayerLastContactedAt.create(row.last_contacted_at),
                },
            );
            players.push(player);
        }

        return players;
    }

    private async insert(room: Room) {

        await this.pool.execute('INSERT INTO room (id, host_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [
                room.id.value,
                room.host.value,
                room.createdAt,
                room.updatedAt,
            ]
        );
        for (const team of room.teams) {
            await this.pool.execute('INSERT INTO team (id, room_id) VALUES (?, ?)', [
                team.id.value,
                room.id.value,
            ]);

            for (const player of team.players) {
                const playerData = player as unknown as {
                    _id: PlayerId,
                    _name: PlayerName,
                    _lastContactedAt: PlayerLastContactedAt
                }

                await this.pool.execute('INSERT INTO team_player (id, team_id, name, last_contacted_at) VALUES (?, ?, ?, ?)', [
                    playerData._id.value,
                    team.id.value,
                    playerData._name.value,
                    playerData._lastContactedAt.value,
                ]);

            }
        }
    }
}
