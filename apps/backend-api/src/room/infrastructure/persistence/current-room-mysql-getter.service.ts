import {CurrentRoom, CurrentRoomGetter} from '../../domain/service/CurrentRoomGetter';
import {RoomId} from '../../domain/valueObjects/RoomId';
import {UserId} from '../../domain/valueObjects/UserId';
import {Injectable} from '@nestjs/common';
import {InjectClient} from "nest-mysql";
import {Connection} from "mysql2/promise";
import {RowDataPacket} from "mysql2/typings/mysql/lib/protocol/packets/RowDataPacket";

@Injectable()
export class CurrentRoomMysqlGetter implements CurrentRoomGetter {
    constructor(@InjectClient() private readonly pool: Connection,) {
    }

    async execute(roomId: RoomId, userId: UserId): Promise<CurrentRoom> {
        const [rows] = await this.pool.query<RowDataPacket[]>(
            `select room.id,
                    host_id,
                    created_at,
                    updated_at,
                    game_session_id,
                    json_arrayagg(json_object('id', teams.id, 'members', teams.members)) as teams
             from room
                      join room_user requester on room.id = requester.room_id
                      join (select team.id,
                                   json_arrayagg(json_object('id', room_user.id, 'name', room_user.name)) as members,
                                   team.room_id
                            from team
                                     join team_member on team.id = team_member.team_id
                                     join room_user on team_member.user_id = room_user.id) as teams
                           on teams.room_id = room.id
             where room.id = ?
               and requester.id = ?;
            `,

            [roomId.value, userId.value]
        )

        const room = rows[0];

        if (!room) {
            throw new Error(`Current Room not found for room id ${roomId.value} and user id ${userId.value}`);
        }


        return {
            id: room.id,
            host: room.host_id,
            isHost: room.host_id === userId.value,
            createdAt: room.created_at,
            updatedAt: room.updated_at,
            gameSessionId: room.game_session_id,
            teams: JSON.parse(room.teams)
        };

    }
}
