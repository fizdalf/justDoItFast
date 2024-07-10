import {JwtService} from "@nestjs/jwt";
import {AuthenticationService, GenerateTokenParams} from "./authentication.service";
import {RoomId} from "../../../room/domain/value-objects/RoomId";
import {RoomToken} from "../../../room/domain/value-objects/RoomToken";

describe('AuthenticationService', () => {

    let authenticationService: AuthenticationService;
    let jwtService: JwtService;

    beforeEach(async () => {
        jwtService = new JwtService({});
        authenticationService = new AuthenticationService(jwtService);
    });

    it('should be defined', () => {
        expect(AuthenticationService).toBeDefined();
    });

    it('should validate token', async () => {
        const token = 'token';
        const roomToken = {
            isHost: true,
            roomId: RoomId.random().value,
            playerName: 'playerName',
            playerId: 'playerId'
        }
        jest.spyOn(jwtService, 'verify').mockImplementation(() => Promise.resolve(roomToken));

        const result = await authenticationService.validateToken(token);

        expect(result).toBe(roomToken);
    });

    it('should generate token', () => {
        const params: GenerateTokenParams = {
            isHost: true,
            roomId: RoomId.random(),
            userName: 'userName',
            userId: 'userId'
        };
        const expected = 'expected';
        jest.spyOn(jwtService, 'sign').mockImplementation(() => expected);

        const result = authenticationService.generateToken(params);

        expect(result).toBe(expected);
    });

    it('should refresh token', () => {
        const decodedToken: RoomToken = {
            isHost: true,
            roomId: RoomId.random().value,
            userName: 'playerName',
            playerId: 'playerId'
        };
        const expected = 'expected';
        jest.spyOn(jwtService, 'sign').mockImplementation(() => expected);

        const result = authenticationService.refreshToken(decodedToken);

        expect(result).toBe(expected);
    });
});
