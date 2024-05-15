import {GameSessionId} from './GameSessionId';
import {Player} from '../entities/Player';

export interface FromDomainParams {
    gameSessionId: GameSessionId;
    player: Player;
    isHost: boolean;
}

export interface ConstructorParams {
    isHost: boolean;
    gameSessionId: string;
    playerName: string;
    playerId: string;
}

export class GameSessionToken {
    public readonly isHost: boolean;
    public readonly gameSessionId: string;
    public readonly playerName: string;
    public readonly playerId: string;

    constructor(param: ConstructorParams) {
        this.isHost = param.isHost;
        this.gameSessionId = param.gameSessionId;
        this.playerName = param.playerName;
        this.playerId = param.playerId;
    }

    static fromDomain(param: FromDomainParams) {
        return new GameSessionToken({
            gameSessionId: param.gameSessionId.value,
            playerId: param.player.id.value,
            playerName: param.player.name.value,
            isHost: param.isHost
        });
    }


    toPrimitives() {
        return {
            isHost: this.isHost,
            gameSessionId: this.gameSessionId,
            playerName: this.playerName,
            playerId: this.playerId
        };
    }
}
