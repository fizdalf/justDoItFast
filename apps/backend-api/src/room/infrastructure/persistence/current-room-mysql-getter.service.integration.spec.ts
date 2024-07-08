import {Test, TestingModule} from '@nestjs/testing';
import {CurrentRoomMysqlGetter} from './current-room-mysql-getter.service';
import {RoomId} from '../../domain/value-objects/RoomId';
import {UserId} from '../../domain/value-objects/UserId';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {RoomMysqlRepository} from "./repository/room-mysql.repository";
import {Room} from "../../domain/aggregateRoots/Room";
import {UserName} from "../../domain/value-objects/UserName";
import {
    DatabaseConnectionCloseFactory,
    DatabaseConnectionFactory
} from "../../../shared/infrastructure/persistence/TestDatabaseFactory";
import {RoomRepository} from "../../domain/repositories/room.repository";
import {EventBus} from "@nestjs/cqrs";

describe('CurrentRoomMysqlGetter', () => {
    let service: CurrentRoomMysqlGetter;
    let roomRepository: RoomRepository;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot()],
            providers: [
                CurrentRoomMysqlGetter,
                RoomMysqlRepository,
                {
                    provide: EventBus,
                    useValue: {
                        publish: jest.fn(),
                        publishAll: jest.fn(),
                    }
                },
                {
                    provide: 'default',
                    inject: [ConfigService],
                    useFactory: DatabaseConnectionFactory
                },
            ],
        }).compile();

        service = module.get<CurrentRoomMysqlGetter>(CurrentRoomMysqlGetter);
        roomRepository = module.get<RoomMysqlRepository>(RoomMysqlRepository);
    });
    afterAll(async () => {
        await DatabaseConnectionCloseFactory()
    });

    it('should return current room for valid room id and user id', async () => {
        console.log('should have cleared the database before running this test!');

        const roomId = RoomId.random();
        const userId = UserId.random();
        const otherUserId = UserId.random();

        const room = Room.create(roomId, userId, UserName.fromValue('randomName'), new Date('2021-01-01T00:00:00.000Z'));
        room.addUser(otherUserId, UserName.fromValue('randomName2'), new Date('2021-01-01T00:00:00.000Z'));
        await roomRepository.save(room);

        const currentRoom = await service.execute(roomId, userId);

        expect(currentRoom).toMatchObject({
            id: roomId.value,
            host: userId.value,
            isHost: true,
            createdAt: '2021-01-01T00:00:00.000Z',
            updatedAt: '2021-01-01T00:00:00.000Z',
            users: [
                {
                    id: userId.value,
                    name: 'randomName',
                },
                {
                    id: otherUserId.value,
                    name: 'randomName2',
                }
            ]
        });
    });

    it('should return current room for a user that is not the host', async () => {
        const roomId = RoomId.random();
        const userId = UserId.random();
        const room = Room.create(roomId, userId, UserName.fromValue('randomName'), new Date('2021-01-01T00:00:00.000Z'));

        const otherUserId = UserId.random();
        const otherUserName = UserName.fromValue('randomName2');
        room.addUser(otherUserId, otherUserName, new Date('2021-01-01T00:00:00.000Z'));

        await roomRepository.save(room);

        const currentRoom = await service.execute(roomId, otherUserId);

        expect(currentRoom).toEqual({
            id: roomId.value,
            host: userId.value,
            isHost: false,
            createdAt: '2021-01-01T00:00:00.000Z',
            updatedAt: '2021-01-01T00:00:00.000Z',
            users: [

                {
                    id: userId.value,
                    name: 'randomName',
                },

                {
                    id: otherUserId.value,
                    name: 'randomName2',
                }
            ]
        });
    });


});

