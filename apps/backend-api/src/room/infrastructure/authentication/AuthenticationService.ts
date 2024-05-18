import {JwtService} from '@nestjs/jwt';
import {Injectable} from '@nestjs/common';
import {RoomToken} from '../../domain/valueObjects/RoomToken';
import {RoomId} from '../../domain/valueObjects/RoomId';
import {Player} from '../../domain/entities/Player';

@Injectable()
export class AuthenticationService {

    constructor(private readonly jwtService: JwtService) {
    }

    async validateToken(authToken: string) {
        return this.jwtService.verify<RoomToken>(authToken);
    }

    generateToken(param: { isHost: boolean; roomId: RoomId; player: Player }) {
        return this.jwtService.sign({
            isHost: param.isHost,
            roomId: param.roomId.value,
            playerName: param.player.name.value,
            playerId: param.player.id.value
        }, {expiresIn: '10d'});
    }

    refreshToken(decodedToken: RoomToken) {
        return this.jwtService.sign({
            isHost: decodedToken.isHost,
            roomId: decodedToken.roomId,
            playerName: decodedToken.playerName,
            playerId: decodedToken.playerId
        }, {expiresIn: '10d'});
    }
}
