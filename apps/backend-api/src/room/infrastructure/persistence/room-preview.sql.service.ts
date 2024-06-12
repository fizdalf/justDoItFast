import {RoomPreviewDto} from "@org/core/room/dto/room-preview.dto";
import {RoomPreviewService} from "../../domain/service/RoomPreviewService";
import {RoomId} from "../../domain/value-objects/RoomId";
import {InjectClient} from "nest-mysql";
import {Connection, RowDataPacket} from "mysql2/promise";


export class RoomPreviewSqlService implements RoomPreviewService {

    constructor(@InjectClient() private readonly pool: Connection) {
    }

    async getRoomPreview(id: RoomId): Promise<RoomPreviewDto> {

        const [queryResult, fieldPacket] = await this.pool.query<RowDataPacket[]>(
            `select room.id,
                    host.name,
                    json_arrayagg(json_object('players', teams.members)) as teams
             from room
                      join room_user host on room.host_id = host.id
                      join (select team.id,
                                   json_arrayagg(room_user.name) as members,
                                   team.room_id
                            from team
                                     join team_member on team.id = team_member.team_id
                                     join room_user on team_member.user_id = room_user.id) as teams
                           on teams.room_id = room.id
             where room.id = ?`,
            [
                id.value
            ]
        );

        if (queryResult.length === 0) {
            throw new Error('Room not found');
        }

        const row = queryResult[0];

        return {
            id: row['id'],
            hostPlayerName: row['name'],
            players: JSON.parse(row['players'])
        }
    }
}
