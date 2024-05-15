import {CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException} from '@nestjs/common';
import {AuthenticationService} from '../../authentication/AuthenticationService';
import {GameSessionToken} from '../../../domain/valueObjects/GameSessionToken';


@Injectable()
export class GameSessionGuard implements CanActivate {

    constructor(private readonly authService: AuthenticationService) {
    }

    async canActivate(context: ExecutionContext) {
        const request = context.switchToHttp().getRequest();
        const {authorization}: any = request.headers;
        if (!authorization || authorization.trim() === '') {
            throw new UnauthorizedException('Please provide token');
        }
        try {
            const authToken = authorization.replace(/bearer/gim, '').trim();

            const resp = await this.authService.validateToken(authToken);
            request.decodedData = new GameSessionToken({
                gameSessionId: resp.gameSessionId,
                playerName: resp.playerName,
                playerId: resp.playerId,
                isHost: resp.isHost
            })
            return true;
        } catch (e) {
            console.log('Auth error', e);
            throw new ForbiddenException('Invalid token');
        }
    }
}
