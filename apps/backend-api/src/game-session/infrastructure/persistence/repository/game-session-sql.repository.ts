import {GameSessionRepository} from '../../../domain/repositories/game-session.repository';

import {GameSession} from '../../../domain/aggregateRoots/GameSession';
import {Connection, RowDataPacket} from 'mysql2/promise';
import {Injectable} from '@nestjs/common';
import {InjectClient} from 'nest-mysql';
import {GameSessionId} from '../../../domain/valueObjects/GameSessionId';
import {PlayerId} from '../../../domain/valueObjects/PlayerId';
import {Player} from '../../../domain/entities/Player';
import {PlayerName} from '../../../domain/valueObjects/PlayerName';
import {Team} from '../../../domain/entities/Team';

export interface GameSessionRow extends RowDataPacket {
    id: string;
    host_id: string;
    created_at: Date;
    updated_at: Date;
}

class GameSessionNotFoundException extends Error {
    constructor(id: GameSessionId) {
        super(`Game session with id ${id.value} not found`);
    }
}

@Injectable()
export class GameSessionSqlRepository implements GameSessionRepository {
    constructor(@InjectClient() private readonly pool: Connection) {

    }

    async findOneById(id: GameSessionId): Promise<GameSession> {

        const [rows, fields] = await this.pool.query<GameSessionRow[]>('select * from game_session where id = ?', [
            id.value,
        ]);
        console.log(fields, rows);
        if (rows.length == 0) {
            throw new GameSessionNotFoundException(id)
        }

        const row = rows[0];

        const teams = await this.getTeams(id)

        return new GameSession({
            id: GameSessionId.fromValue(row.id),
            host: PlayerId.fromValue(row.host_id),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            teams: teams,
        });

    }

    async save(gameSession: GameSession): Promise<void> {
        const connection = this.pool;
        await connection.beginTransaction();

        try {
            await connection.execute('delete from game_session where id = ?', [
                gameSession.id.value,
            ]);

            await connection.execute('INSERT INTO game_session (id, host_id, created_at, updated_at) VALUES (?, ?, ?, ?)', [
                gameSession.id.value,
                gameSession.host.value,
                (<any>gameSession).createdAt,
                (<any>gameSession).createdAt,
            ]);

            for (const team of gameSession.teams) {
                await connection.execute('delete from team where id = ?', [
                    team.id.value,
                ]);


                await connection.execute('INSERT INTO team (id, game_session_id) VALUES (?, ?)', [
                    team.id.value,
                    gameSession.id.value,
                ]);

                for (const player of team.players) {
                    await connection.execute('delete from team_player where player_id = ? and team_id = ?', [
                        player.id.value,
                        team.id.value,
                    ]);

                    await connection.execute('INSERT INTO team_player (player_id, team_id, name) VALUES (?, ?, ?)', [
                        player.id.value,
                        team.id.value,
                        player.name.value,
                    ]);

                }
            }
            console.log('done');
        } catch (error) {
            console.log('rolling back', error);
            await connection.rollback();
            throw error;
        }
        console.log('committing');
        await connection.commit();
    }

    private async getTeams(id: GameSessionId) {
        const [rows, fields] = await this.pool.query<RowDataPacket[]>('select * from team where game_session_id = ?', [
            id.value,
        ]);

        const teams = [];

        for (const row of rows) {
            const team = new Team(
                PlayerId.fromValue(row.id),
                await this.getPlayers(row.id),
            );
            teams.push(team);
        }

        return teams;
    }

    private async getPlayers(id: any) {
        const [rows, fields] = await this.pool.query<RowDataPacket[]>('select * from team_player where team_id = ?', [
            id,
        ]);

        const players = [];

        for (const row of rows) {
            const player = new Player(
                {
                    id: PlayerId.fromValue(row.player_id),
                    name: PlayerName.fromValue(row.name),
                },
            );
            players.push(player);
        }

        return players;
    }
}
