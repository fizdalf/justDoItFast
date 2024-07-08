import {RoomMysqlRepository} from "./room-mysql.repository";
import {Test, TestingModule} from "@nestjs/testing";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {RoomId} from "../../../domain/value-objects/RoomId";
import {UserId} from "../../../domain/value-objects/UserId";
import {Room} from "../../../domain/aggregateRoots/Room";
import {UserName} from "../../../domain/value-objects/UserName";
import {EventBus} from "@nestjs/cqrs";
import {
    DatabaseConnectionCloseFactory,
    DatabaseConnectionFactory
} from "../../../../shared/infrastructure/persistence/TestDatabaseFactory";


describe('RoomMysqlRepository', () => {
    let roomRepository: RoomMysqlRepository = null;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot()],
            providers: [
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

        roomRepository = module.get<RoomMysqlRepository>(RoomMysqlRepository);
    });

    afterAll(async () => {
        await DatabaseConnectionCloseFactory();
    });

    it('should save and load a room', async () => {
        console.log('room-mysql test started');
        const roomId = RoomId.random();
        const userId = UserId.random();
        const otherUserId = UserId.random();

        const room = Room.create(roomId, userId, UserName.fromValue('randomName'), new Date('2021-01-01T00:00:00.000Z'));
        room.addUser(otherUserId, UserName.fromValue('randomName2'), new Date('2021-01-01T00:00:00.000Z'));
        await roomRepository.save(room);

        const currentRoom = await roomRepository.findOneById(roomId);

        expect(currentRoom.id).toEqual(room.id);
        expect(currentRoom.host).toEqual(room.host);
        expect(currentRoom.users).toEqual(room.users);
        console.log('room-mysql test finished');
    });
})
