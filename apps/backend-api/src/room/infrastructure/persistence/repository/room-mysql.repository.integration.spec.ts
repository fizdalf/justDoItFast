import {RoomMysqlRepository} from "./room-mysql.repository";
import {Test, TestingModule} from "@nestjs/testing";
import {ConfigModule, ConfigService} from "@nestjs/config";
import {createConnection} from "mysql2/promise";
import {tableIndex} from "../../../../shared/infrastructure/persistence/table-index";
import {RoomId} from "../../../domain/value-objects/RoomId";
import {UserId} from "../../../domain/value-objects/UserId";
import {Room} from "../../../domain/aggregateRoots/Room";
import {UserName} from "../../../domain/value-objects/UserName";
import {EventBus} from "@nestjs/cqrs";


describe('RoomMysqlRepository', () => {
    let connection = null;
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
                    useFactory: async (config: ConfigService) => {
                        if (!connection) {
                            connection = await createConnection({
                                host: config.get('TEST_DATABASE_HOST'),
                                user: config.get('TEST_DATABASE_USER'),
                                password: config.get('TEST_DATABASE_PASSWORD'),
                                database: config.get('TEST_DATABASE_NAME'),
                                port: config.get('TEST_DATABASE_PORT'),
                            });
                        }
                        await connection.query('SET FOREIGN_KEY_CHECKS=0;');
                        for (const tableName of tableIndex) {
                            await connection.query(`TRUNCATE TABLE ${tableName};`);
                        }
                        await connection.query('SET FOREIGN_KEY_CHECKS=1;');
                        return connection;
                    }
                },
            ],
        }).compile();

        roomRepository = module.get<RoomMysqlRepository>(RoomMysqlRepository);
    });

    afterAll(async () => {
        await connection.end();
    });

    it('should save and load a room', async () => {
        const roomId = RoomId.random();
        const userId = UserId.random();
        const otherUserId = UserId.random();

        const room = Room.create(roomId, userId, UserName.fromValue('randomName'), new Date('2021-01-01T00:00:00.000Z'));
        room.addUser(otherUserId, UserName.fromValue('randomName2'), new Date('2021-01-01T00:00:00.000Z'));
        await roomRepository.save(room);

        const currentRoom = await roomRepository.findOneById(roomId);

        expect(currentRoom).toEqual(room);
    });
})
