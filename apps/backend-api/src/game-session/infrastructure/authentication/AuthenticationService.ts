import {JwtService} from '@nestjs/jwt';
import {Injectable} from '@nestjs/common';
import {GameSessionToken} from '../../domain/valueObjects/GameSessionToken';
import {GameSessionId} from '../../domain/valueObjects/GameSessionId';
import {Player} from '../../domain/entities/Player';

@Injectable()
export class AuthenticationService {

    constructor(private readonly jwtService: JwtService) {
    }

    async validateToken(authToken: string) {
        return this.jwtService.verify<GameSessionToken>(authToken);
    }

    generateToken(param: { isHost: boolean; gameSessionId: GameSessionId; player: Player }) {
        return this.jwtService.sign({
            isHost: param.isHost,
            gameSessionId: param.gameSessionId.value,
            playerName: param.player.name.value,
            playerId: param.player.id.value
        }, {expiresIn: '10d'});
    }

    refreshToken(decodedToken: GameSessionToken) {
        return this.jwtService.sign({
            isHost: decodedToken.isHost,
            gameSessionId: decodedToken.gameSessionId,
            playerName: decodedToken.playerName,
            playerId: decodedToken.playerId
        }, {expiresIn: '10d'});
    }
}
