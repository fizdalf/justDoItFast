import {JwtService} from '@nestjs/jwt';
import {Injectable} from '@nestjs/common';

@Injectable()
export class AuthenticationService {

    constructor(private readonly jwtService: JwtService) {
    }

    async validateToken(authToken: string) {
        return this.jwtService.verify(authToken);
    }
}
