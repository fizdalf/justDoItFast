import {RoomRepository} from '../../../domain/repositories/room.repository';

import {Room} from '../../../domain/aggregateRoots/Room';
import {Connection, RowDataPacket} from 'mysql2/promise';
import {Inject, Injectable} from '@nestjs/common';
import {InjectClient} from 'nest-mysql';
import {RoomId} from '../../../domain/valueObjects/RoomId';
import {UserId} from '../../../domain/valueObjects/UserId';
import {User} from '../../../domain/entities/User';
import {UserName} from '../../../domain/valueObjects/UserName';
import {Team} from '../../../domain/entities/Team';
import {UserLastContactedAt} from '../../../domain/valueObjects/userLastContactedAt';
import {TeamId} from '../../../domain/valueObjects/TeamId';
import {EventBus, IEventBus} from '@nestjs/cqrs';
import {RoomCreatedEvent} from '../../../domain/events/room-created.event';
import {RoomPlayerJoinedEvent} from '../../../domain/events/room-player-joined.event';
import {RoomPlayerLeftEvent} from '../../../domain/events/room-player-left.event';
import {RoomHostChangedEvent} from '../../../domain/events/room-host-changed.event';
import {RoomPlayerContactRegisteredEvent} from '../../../domain/events/room-player-contact-registered.event';
import {RoomGameSessionCreatedEvent} from "../../../domain/events/room-game-session-created.event";
import {GameSessionId} from "../../../domain/valueObjects/GameSessionId";
import {RoomPersistence, RoomPersistenceData} from "./RoomPersistence";

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
                'delete room, team, team_member from room left join team on team.room_id = room.id left join team_member on team_member.team_id = team.id  where room.id = ?',
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

        const [rows] = await this.pool.query<RoomRow[]>('select id, host_id, created_at, updated_at, teams, game_session_id from room where id = ?', [
            id.value,
        ]);
        if (rows.length == 0) {
            throw new RoomNotFoundException(id)
        }

        const roomRawData = rows[0];

        const users = await this.getUsers(id);
        const teams = await this.getTeams(id, users);

        return new Room({
            id: RoomId.fromValue(roomRawData.id),
            host: UserId.fromValue(roomRawData.host_id),
            createdAt: roomRawData.created_at,
            updatedAt: roomRawData.updated_at,
            teams: teams,
            gameSessionId: roomRawData.game_session_id ? GameSessionId.fromValue(roomRawData.game_session_id) : undefined,
        });

    }


    async save(room: Room): Promise<void> {

        const events = room.getUncommittedEvents();
        await this.pool.beginTransaction();

        const persistenceRoom = new RoomPersistence(room).toPersistence();

        try {
            for (const event of events) {
                switch (event.constructor.name) {

                    case RoomCreatedEvent.name:
                        await this.insert(persistenceRoom)
                        break;
                    case RoomPlayerJoinedEvent.name:
                        const playerJoinedEvent = event as RoomPlayerJoinedEvent;
                        await this.pool.execute('INSERT INTO team_member (user_id, team_id) VALUES (?, ?)', [
                            playerJoinedEvent.playerId,
                            playerJoinedEvent.teamId,
                            playerJoinedEvent.playerName,
                            playerJoinedEvent.dateTimeOccurred,
                        ]);
                        break;
                    case RoomPlayerLeftEvent.name:
                        const playerLeftEvent = event as RoomPlayerLeftEvent;
                        await this.pool.execute('delete from team_member where user_id = ?', [
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
                        await this.pool.execute('update room_user set last_contacted_at = ? where id = ?', [
                            new Date(playerContactRegisteredEvent.lastContactedAt),
                            playerContactRegisteredEvent.playerId,
                        ]);
                        break;

                    case RoomGameSessionCreatedEvent.name:
                        const gameSessionCreatedEvent = event as RoomGameSessionCreatedEvent;
                        await this.pool.execute('update room set game_session_id = ? where id = ?', [
                            gameSessionCreatedEvent.roomId,
                            gameSessionCreatedEvent.gameSessionId,
                        ]);
                }

            }
        } catch (error) {
            await this.pool.rollback();
            throw error;
        }
        await this.pool.commit();

        this.eventBus.publishAll(events);

    }

    private async getTeams(id: RoomId, users: User[]) {
        const [rows] = await this.pool.query<RowDataPacket[]>('select * from team where room_id = ?', [
            id.value,
        ]);

        const teams = [];

        for (const row of rows) {
            const teamMembers = await this.getTeamMembers(row.id, users);

            const team = new Team(
                {id: TeamId.fromValue(row.id), members: teamMembers},
            );
            teams.push(team);
        }

        return teams;
    }

    private async getTeamMembers(id: any, users: User[]) {
        const [rows] = await this.pool.query<RowDataPacket[]>('select user_id from team_member where team_id = ?', [
            id,
        ]);

        const players = [];

        for (const row of rows) {
            const user = users.find(user => user.id.value === row.user_id);
            if (!user) {
                throw new Error('Could not find user while fetching team members!');
            }
            players.push(user);
        }

        return players;
    }

    private async insert(room: RoomPersistenceData) {

        await this.pool.execute('INSERT INTO room (id, host_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [
                room.id,
                room.host,
                room.createdAt,
                room.updatedAt,
            ]
        );

        for (const team of room.teams) {
            await this.pool.execute('INSERT INTO team (id, room_id) VALUES (?, ?)', [
                team.id,
                room.id,
            ]);


            for (const userId of team.members) {
                await this.pool.execute('INSERT INTO team_member (user_id, team_id) VALUES (?, ?)', [
                    userId,
                    team.id,
                ]);

            }
        }

        for (const user of room.users) {
            await this.pool.execute('INSERT INTO room_user (id, room_id, name, last_contacted_at) VALUES (?, ?, ?, ?)', [
                user.id,
                room.id,
                user.name,
                user.lastContactedAt,
            ]);
        }

    }

    private async getUsers(id: RoomId) {

        const [rows] = await this.pool.query<RowDataPacket[]>('select * from room_user where room_id = ?', [
            id.value,
        ]);

        const users = [];

        for (const row of rows) {
            const user = new User(
                {
                    id: UserId.fromValue(row.id),
                    name: UserName.fromValue(row.name),
                    lastContactedAt: UserLastContactedAt.create(row.last_contacted_at),
                },
            );
            users.push(user);
        }
        return users;
    }
}
