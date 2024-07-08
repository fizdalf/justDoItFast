import {RoomRepository} from '../../../domain/repositories/room.repository';

import {Room} from '../../../domain/aggregateRoots/Room';
import {Connection, RowDataPacket} from 'mysql2/promise';
import {Inject, Injectable} from '@nestjs/common';
import {InjectClient} from 'nest-mysql';
import {RoomId} from '../../../domain/value-objects/RoomId';
import {UserId} from '../../../domain/value-objects/UserId';
import {User} from '../../../domain/entities/User';
import {UserName} from '../../../domain/value-objects/UserName';
import {UserLastContactedAt} from '../../../domain/value-objects/userLastContactedAt';
import {EventBus, IEvent, IEventBus} from '@nestjs/cqrs';
import {RoomCreatedEvent} from '../../../domain/events/room-created.event';
import {RoomUserJoinedEvent} from '../../../domain/events/room-user-joined.event';
import {RoomUserLeftEvent} from '../../../domain/events/room-user-left.event';
import {RoomHostChangedEvent} from '../../../domain/events/room-host-changed.event';
import {RoomUserContactRegisteredEvent} from '../../../domain/events/room-user-contact-registered.event';
import {GameSessionCreatedEvent} from "../../../../game-session/domain/events/game-session-created.event";
import {DomainEvent} from "../../../../shared/domain/domain-event";

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
export class RoomMysqlRepository implements RoomRepository {

    constructor(
        @InjectClient() private readonly pool: Connection,
        @Inject(EventBus) private readonly eventBus: IEventBus
    ) {

    }

    async remove(id: RoomId): Promise<void> {
        await this.pool.beginTransaction();
        try {
            await this.pool.execute(
                `delete room, room_user
                 from room
                          left join room_user on room_user.room_id = room.id
                 where room.id = ?`,
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

        const [rows] = await this.pool.query<RoomRow[]>('select id, host_id, created_at, updated_at, game_session_id from room where id = ?', [
            id.value,
        ]);
        if (rows.length == 0) {
            throw new RoomNotFoundException(id)
        }

        const roomRawData = rows[0];

        const users = await this.getUsers(id);

        return new Room({
            id: RoomId.fromValue(roomRawData.id),
            host: UserId.fromValue(roomRawData.host_id),
            createdAt: roomRawData.created_at,
            users: users,
        });

    }


    async save(room: Room): Promise<void> {

        room.publish = (event: IEvent) => this.eventBus.publish(event);
        room.publishAll = (events: IEvent[]) => this.eventBus.publishAll(events);

        const events = room.getUncommittedEvents();
        await this.pool.beginTransaction();
        try {
            await this.saveEvents(events);
            await this.pool.commit();
            room.commit();
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
                case RoomCreatedEvent.EVENT_NAME:
                    const roomCreatedEvent = event as RoomCreatedEvent;
                    await this.pool.execute('INSERT INTO room (id, host_id, created_at, updated_at) VALUES (?, ?, ?, ?)', [
                        roomCreatedEvent.aggregateId,
                        roomCreatedEvent.hostId,
                        roomCreatedEvent.occurredOn,
                        roomCreatedEvent.occurredOn,
                    ]);


                    await this.pool.execute('INSERT INTO room_user (id, room_id, name, last_contacted_at) VALUES (?, ?, ?, ?)', [
                        roomCreatedEvent.hostId,
                        roomCreatedEvent.aggregateId,
                        roomCreatedEvent.hostName,
                        roomCreatedEvent.occurredOn,
                    ]);

                    break;
                case RoomUserJoinedEvent.EVENT_NAME:
                    const playerJoinedEvent = event as RoomUserJoinedEvent;
                    await this.pool.execute('INSERT INTO room_user (id, room_id, name, last_contacted_at) VALUES (?, ?, ?, ?)', [
                        playerJoinedEvent.userId,
                        playerJoinedEvent.aggregateId,
                        playerJoinedEvent.userName,
                        playerJoinedEvent.occurredOn,
                    ]);
                    break;
                case RoomUserLeftEvent.EVENT_NAME:
                    const playerLeftEvent = event as RoomUserLeftEvent;
                    await this.pool.execute('delete from room_user where id = ?', [
                        playerLeftEvent.userId,
                    ]);
                    break;
                case RoomHostChangedEvent.EVENT_NAME:
                    const hostChangedEvent = event as RoomHostChangedEvent;
                    await this.pool.execute('update room set host_id = ? where id = ?', [
                        hostChangedEvent.newHostId,
                        hostChangedEvent.aggregateId,
                    ]);
                    break;
                case RoomUserContactRegisteredEvent.EVENT_NAME:
                    const playerContactRegisteredEvent = event as RoomUserContactRegisteredEvent;
                    await this.pool.execute('update room_user set last_contacted_at = ? where id = ?', [
                        new Date(playerContactRegisteredEvent.lastContactedAt),
                        playerContactRegisteredEvent.userId,
                    ]);
                    break;

                case GameSessionCreatedEvent.EVENT_NAME:
                    const gameSessionCreatedEvent = event as GameSessionCreatedEvent;
                    await this.pool.execute('update room set game_session_id = ? where id = ?', [
                        gameSessionCreatedEvent.aggregateId,
                        gameSessionCreatedEvent.roomId,
                    ]);
            }

        }
    }

    private async getUsers(id: RoomId) {

        const [rows] = await this.pool.query<RowDataPacket[]>('select * from room_user where room_id = ?', [
            id.value,
        ]);

        return rows.map(row =>
            new User(
                {
                    id: UserId.fromValue(row.id),
                    name: UserName.fromValue(row.name),
                    lastContactedAt: UserLastContactedAt.create(row.last_contacted_at),
                },
            )
        );
    }
}
