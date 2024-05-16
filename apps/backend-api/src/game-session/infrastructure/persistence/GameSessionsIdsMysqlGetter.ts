import {GameSessionsIdsGetter} from '../../domain/service/GameSessionsIdsGetter';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {Injectable} from '@nestjs/common';
import {InjectClient} from 'nest-mysql';
import {Connection, RowDataPacket} from 'mysql2/promise';

export interface GameSessionIdRow extends RowDataPacket {
    id: string;
}


@Injectable()
export class GameSessionsIdsMysqlGetter implements GameSessionsIdsGetter {

    constructor(@InjectClient() private readonly pool: Connection) {
    }

    async getGameSessionsIds(): Promise<GameSessionId[]> {
        const result = await this.pool.query<GameSessionIdRow[]>('SELECT id FROM game_session');

        return result[0].map(row => GameSessionId.fromValue(row.id));
    }

}
