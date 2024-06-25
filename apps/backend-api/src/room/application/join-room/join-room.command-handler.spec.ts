import {JoinRoomCommandHandler} from '../../../../src/room/application/join-room/join-room-command.handler';
import {RoomRepository} from '../../../../src/room/domain/repositories/room.repository';
import {Room} from '../../../../src/room/domain/aggregateRoots/Room';
import {RoomId} from '../../domain/value-objects/RoomId';
import {User} from '../../../../src/room/domain/entities/User';
import {UserId} from '../../domain/value-objects/UserId';
import {UserName} from '../../domain/value-objects/UserName';
import {UserLastContactedAt} from '../../domain/value-objects/userLastContactedAt';
import {JoinRoomCommand} from "../../../../src/room/domain/commands/join-room.command";
import {DateTimeService} from "../../../../src/shared/domain/date-time.service";


describe('JoinRoomCommandHandler', () => {
    let service: JoinRoomCommandHandler;
    let roomRepoMock: jest.Mocked<RoomRepository>;
    let dateTimeServiceMock: jest.Mocked<DateTimeService>;


    beforeEach(async () => {


        roomRepoMock = {
            findOneById: jest.fn(),
            save: jest.fn(),
            remove: jest.fn()
        };

        dateTimeServiceMock = {
            now: jest.fn().mockReturnValue(new Date())
        };

        service = new JoinRoomCommandHandler(
            roomRepoMock,
            dateTimeServiceMock
        );

    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should make the given user join the room', async () => {
        const roomId = RoomId.random();
        const hostPlayerId = UserId.random();
        const user = new User({
            id: hostPlayerId,
            name: UserName.fromValue('player1'),
            lastContactedAt: new UserLastContactedAt(new Date())
        });
        const room: Room = new Room({
            id: roomId,
            host: hostPlayerId,
            createdAt: new Date(),
            users: [user]
        });

        const newPlayerId = UserId.random();

        roomRepoMock.findOneById = jest.fn().mockResolvedValue(room);
        const command = new JoinRoomCommand(
            roomId,
            newPlayerId,
            UserName.fromValue('player2'))

        await service.execute(command);

        expect(roomRepoMock.findOneById).toHaveBeenCalledWith(roomId);

        expect(roomRepoMock.save).toHaveBeenCalledWith(room);
    });
});
