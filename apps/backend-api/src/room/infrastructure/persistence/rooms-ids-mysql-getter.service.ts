import {RoomsIdsGetter} from '../../domain/service/RoomsIdsGetter';
import {RoomId} from '../../domain/valueObjects/RoomId';
import {Injectable} from '@nestjs/common';
import {InjectClient} from 'nest-mysql';
import {Connection, RowDataPacket} from 'mysql2/promise';

export interface RoomIdRow extends RowDataPacket {
    id: string;
}


@Injectable()
export class RoomsIdsMysqlGetter implements RoomsIdsGetter {

    constructor(@InjectClient() private readonly pool: Connection) {
    }

    async getRoomsIds(): Promise<RoomId[]> {
        const result = await this.pool.query<RoomIdRow[]>('SELECT id FROM room');

        return result[0].map(row => RoomId.fromValue(row.id));
    }

}
