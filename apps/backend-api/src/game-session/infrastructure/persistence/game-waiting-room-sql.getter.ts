import {GameWaitingRoomDto} from "@org/core/game/dto/game-waiting-room.dto";
import {RoomId} from "apps/backend-api/src/room/domain/value-objects/RoomId";
import {UserId} from "apps/backend-api/src/room/domain/value-objects/UserId";
import {GameWaitingRoomGetter} from "../../domain/services/game-waiting-room.getter";
import {InjectClient} from "nest-mysql";
import {Connection} from "mysql2/promise";

export class GameWaitingRoomSqlGetter implements GameWaitingRoomGetter {

    constructor(@InjectClient() private readonly pool: Connection,) {
    }

    async execute(roomId: RoomId, userId: UserId): Promise<GameWaitingRoomDto> {

        const [rows] = await this.pool.query(
            `select game_session.id,
                    host_id,
                    json_arrayagg(json_object('id', room_user.id, 'name', room_user.name))     as users,
                    json_arrayagg(json_object('idx', seat.idx, 'userId', seat.player_user_id)) as seats
             from game_session
                      join room on game_session.room_id = room.id
                      join room_user requester on room.id = requester.room_id
                      join room_user on room_user.room_id = room.id
                      join game_session_seat seat
                           on seat.game_session_id = game_session.id and room_user.id = seat.player_user_id
             where requester.id = ?;
            `,

            [userId.value]
        )

        const gameWaitingRoomRaw = rows[0];

        return {
            id: gameWaitingRoomRaw.id,
            users: JSON.parse(gameWaitingRoomRaw.users),
            seats: JSON.parse(gameWaitingRoomRaw.seats),
            roomId: roomId.value,
            isHost: gameWaitingRoomRaw.host_id === userId.value,
        }
    }

}