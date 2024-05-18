import {CreateRoomController} from './create-room.controller';
import {CommandBus} from '@nestjs/cqrs';
import {CreateRoom} from '../../../../domain/commands/create-room.command';
import {RoomId} from '../../../../domain/valueObjects/RoomId';
import {Player} from '../../../../domain/entities/Player';
import {PlayerId} from '../../../../domain/valueObjects/PlayerId';
import {PlayerName} from '../../../../domain/valueObjects/PlayerName';
import {AuthenticationService} from '../../../authentication/AuthenticationService';


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
                    host: new Player({
                        id: expect.any(PlayerId),
                        name: PlayerName.fromValue('test'),
                        lastContactedAt: expect.any(Date)
                    })
                })
            );
        });
    });
});