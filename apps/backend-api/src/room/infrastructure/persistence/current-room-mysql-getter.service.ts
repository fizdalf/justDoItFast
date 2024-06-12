import {CurrentRoomGetter} from '../../domain/service/CurrentRoomGetter';
import {RoomId} from '../../domain/value-objects/RoomId';
import {UserId} from '../../domain/value-objects/UserId';
import {Injectable} from '@nestjs/common';
import {InjectClient} from "nest-mysql";
import {Connection} from "mysql2/promise";
import {RowDataPacket} from "mysql2/typings/mysql/lib/protocol/packets/RowDataPacket";
import {CurrentRoomDto} from "@org/core/room/dto/current-room.dto";

@Injectable()
export class CurrentRoomMysqlGetter implements CurrentRoomGetter {
    constructor(@InjectClient() private readonly pool: Connection,) {
    }

    async execute(roomId: RoomId, userId: UserId): Promise<CurrentRoomDto> {
        const [rows] = await this.pool.query<RowDataPacket[]>(
            `select room.id,
                    host_id,
                    created_at,
                    updated_at,
                    json_arrayagg(json_object('id', room_user.id, 'name', room_user.name)) as users
             from room
                      join room_user requester on room.id = requester.room_id
                      join room_user on room.id = requester.room_id
             where requester.id = ?;
            `,

            [userId.value]
        )

        const room = rows[0];

        if (!room) {
            throw new Error(`Current Room not found for room id ${roomId.value} and user id ${userId.value}`);
        }
        return {
            id: room.id,
            host: room.host_id,
            isHost: room.host_id === userId.value,
            createdAt: room.created_at.toISOString(),
            updatedAt: room.updated_at.toISOString(),
            users: JSON.parse(room.users)
        };

    }
}
