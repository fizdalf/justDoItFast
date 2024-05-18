import {IQueryHandler, QueryHandler} from '@nestjs/cqrs';
import {GetRoomPreviewQuery} from '../../domain/query/get-room-preview.query';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {Inject, Injectable} from '@nestjs/common';
import {RoomId} from '../../domain/valueObjects/RoomId';

import {RoomPreview} from '@org/core/room/dto/roomPreview';


@QueryHandler(GetRoomPreviewQuery)
@Injectable()
export class GetRoomPreviewQueryHandler implements IQueryHandler<GetRoomPreviewQuery> {

    constructor(@Inject(RoomRepository) private repository: RoomRepository) {
    }

    public async execute(query: GetRoomPreviewQuery): Promise<RoomPreview> {
        const room = await this.repository.findOneById(RoomId.fromValue(query.roomId));

        return {
            id: room.id.value,
            hostPlayerName: room.hostPlayerName().value,
            teams: room.teams.map(team => ({
                players: team.players.map(player => ({
                    name: player.name.value,
                })),
            }))
        };
    }
}
