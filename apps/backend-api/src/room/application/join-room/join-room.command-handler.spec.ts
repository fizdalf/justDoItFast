import {JoinRoomCommandHandler} from './join-room-command.handler';
import {RoomRepository} from '../../domain/repositories/room.repository';
import {Room} from '../../domain/aggregateRoots/Room';
import {RoomId} from '../../domain/valueObjects/RoomId';
import {Team} from '../../domain/entities/Team';
import {TeamId} from '../../domain/valueObjects/TeamId';
import {User} from '../../domain/entities/User';
import {UserId} from '../../domain/valueObjects/UserId';
import {UserName} from '../../domain/valueObjects/UserName';
import {UserLastContactedAt} from '../../domain/valueObjects/userLastContactedAt';


describe('JoinRoomCommandHandler', () => {
    let service: JoinRoomCommandHandler;
    let roomRepoMock: jest.Mocked<RoomRepository>;


    beforeEach(async () => {



        roomRepoMock = {
            findOneById: jest.fn(),
            save: jest.fn(),
            remove: jest.fn()
        };

        service = new JoinRoomCommandHandler(
            roomRepoMock,
        );

    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should make the given user join the room', async () => {
        const roomId = RoomId.random();
        const hostPlayerId = UserId.random();
        const room: Room = new Room({
            id: roomId,
            teams: [
                new Team({id : TeamId.random(), members : [
                    new User({id: hostPlayerId, name: UserName.fromValue('player1'), lastContactedAt: new UserLastContactedAt(new Date())}),
                ]})
            ],
            host: hostPlayerId,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const newPlayerId = UserId.random();

        roomRepoMock.findOneById = jest.fn().mockResolvedValue(room);
        const command = {
            sessionId: roomId.value,
            playerId: newPlayerId.value,
            playerName: 'playerName'
        };
        await service.execute(command);

        expect(roomRepoMock.findOneById).toHaveBeenCalledWith({value: command.sessionId});
        expect(roomRepoMock.save).toHaveBeenCalledWith(room);
    });
});
