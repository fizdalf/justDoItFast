import {CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException} from '@nestjs/common';
import {AuthenticationService} from '../../authentication/authentication.service';


@Injectable()
export class RoomConnectedGuard implements CanActivate {

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
            request.decodedData = await this.authService.validateToken(authToken);
            return true;
        } catch (e) {
            throw new ForbiddenException('Invalid token');
        }
    }
}
