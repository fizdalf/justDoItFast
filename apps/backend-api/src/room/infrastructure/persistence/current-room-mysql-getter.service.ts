import {CurrentRoom, CurrentRoomGetter} from '../../domain/service/CurrentRoomGetter';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {RoomId} from '../../domain/valueObjects/RoomId';
import {PlayerId} from '../../domain/valueObjects/PlayerId';
import {Inject, Injectable} from '@nestjs/common';
import {Room} from '../../domain/aggregateRoots/Room';

class PlayerNotInSessionException extends Error {
    constructor(playerId: PlayerId, roomId: RoomId) {
        super(`Player with id ${playerId.value} is not in session with id ${roomId.value}`);
    }
}

@Injectable()
export class CurrentRoomMysqlGetter implements CurrentRoomGetter {
    constructor(@Inject(RoomRepository) private readonly repository: RoomRepository) {
    }

    async execute(roomId: RoomId, playerId: PlayerId): Promise<CurrentRoom> {
        const room = await this.repository.findOneById(roomId);

        this.verifyPlayerInSession(room, playerId);

        return {
            id: room.id.value,
            host: room.host.value,
            isHost: room.host.equals(playerId),
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
            teams: room.teams.map(team => ({
                id: team.id.value,
                players: team.players.map(player => ({
                    id: player.id.value,
                    name: player.name.value,
                })),
            })),
        };

    }

    private verifyPlayerInSession(room: Room, playerId: PlayerId) {

        if (!room.isPlayerInSession(playerId)) {
            throw new PlayerNotInSessionException(playerId, room.id);
        }
    }
}
