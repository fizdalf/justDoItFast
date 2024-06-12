import {CreateRoomCommandHandler} from '../../../../src/room/application/create-room/create-room-command.handler';
import {RoomId} from '../../domain/value-objects/RoomId';
import {UserId} from '../../domain/value-objects/UserId';
import {Room} from '../../../../src/room/domain/aggregateRoots/Room';
import {UserName} from '../../domain/value-objects/UserName';
import {RoomRepository} from "../../../../src/room/domain/repositories/room.repository";
import {DateTimeService} from "../../../../src/shared/domain/date-time.service";
import {CreateRoom} from "../../../../src/room/domain/commands/create-room.command";

describe('CreateRoomCommandHandler', () => {

    let roomRepoMock: jest.Mocked<RoomRepository>;
    let dateTimeServiceMock: jest.Mocked<DateTimeService>;

    it('should be defined', () => {
        expect(CreateRoomCommandHandler).toBeDefined();
    });

    it('should create a new room', async () => {

        roomRepoMock = {
            findOneById: jest.fn(),
            save: jest.fn(),
            remove: jest.fn()
        };

        dateTimeServiceMock = {
            now: jest.fn().mockReturnValue(new Date())
        };

        const roomId = RoomId.random();
        const userId = UserId.random();
        const userName = UserName.fromValue('pepe');
        const command = new CreateRoom({
            roomId,
            userId: userId,
            userName: userName,
        });


        const createRoomCommandHandler = new CreateRoomCommandHandler(roomRepoMock, dateTimeServiceMock);

        await createRoomCommandHandler.execute(command);

        expect(roomRepoMock.save).toHaveBeenCalledWith(expect.any(Room));
        const savedRoom = roomRepoMock.save.mock.calls[0][0];
        expect(savedRoom).toEqual(expect.any(Room));
    });
});



