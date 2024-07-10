import {CreateRoomController} from './create-room.controller';
import {CommandBus} from '@nestjs/cqrs';
import {CreateRoom} from '../../../../domain/commands/create-room.command';
import {RoomId} from '../../../../domain/value-objects/RoomId';
import {UserId} from '../../../../domain/value-objects/UserId';
import {UserName} from '../../../../domain/value-objects/UserName';
import {AuthenticationService} from '../../../../../shared/infrastructure/authentication/authentication.service';


describe('CreateRoomController', () => {
    let createRoomController: CreateRoomController;

    let commandBusMock = {
        execute: jest.fn()
    }
    let authenticationService = {
        validateToken: jest.fn(),
        generateToken: jest.fn(),
        refreshToken: jest.fn()
    }

    beforeAll(async () => {
        createRoomController = new CreateRoomController(
            commandBusMock as unknown as CommandBus,
            authenticationService as unknown as AuthenticationService
        );
    });

    describe('getRoomPreview', () => {
        it('should execute create room command', async () => {

            await createRoomController.createRoom({hostPlayerName: 'test',});

            expect(commandBusMock.execute).toHaveBeenCalledWith(
                new CreateRoom({
                    roomId: expect.any(RoomId),
                    userId: expect.any(UserId),
                    userName: UserName.fromValue('test'),
                })
            );
        });
    });
});
