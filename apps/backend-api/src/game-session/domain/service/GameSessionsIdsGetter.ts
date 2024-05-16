import {GameSessionId} from '../valueObjects/GameSessionId';

export const GameSessionsIdsGetter = Symbol('GameSessionsIdsGetter');

export interface GameSessionsIdsGetter {
    getGameSessionsIds(): Promise<GameSessionId[]>;
}
