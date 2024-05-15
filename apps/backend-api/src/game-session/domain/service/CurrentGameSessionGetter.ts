import {GameSessionId} from '../valueObjects/GameSessionId';
import {PlayerId} from '../valueObjects/PlayerId';

export const CurrentGameSessionGetter = Symbol('CurrentGameSessionGetter');

export interface CurrentGameSession {
    id: string;
    host: string;
    createdAt: Date;
    updatedAt: Date;
    teams: {
        id: string;
        players: {
            id: string;
            name: string;
        }[];
    }[];
}

export interface CurrentGameSessionGetter {
    execute(gameSessionId: GameSessionId, playerId: PlayerId): Promise<CurrentGameSession>;
}
