import {Test, TestingModule} from '@nestjs/testing';
import {CurrentRoomMysqlGetter} from './current-room-mysql-getter.service';
import {RoomId} from '../../domain/value-objects/RoomId';
import {UserId} from '../../domain/value-objects/UserId';
import {Connection, createConnection} from 'mysql2/promise';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {tableIndex} from "../../../shared/infrastructure/persistence/table-index";
import {RoomMysqlRepository} from "./repository/room-mysql.repository";
import {Room} from "../../domain/aggregateRoots/Room";
import {UserName} from "../../domain/value-objects/UserName";

describe('CurrentRoomMysqlGetter', () => {
    let service: CurrentRoomMysqlGetter;
    let connection: Connection;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot()],
            providers: [
                CurrentRoomMysqlGetter,

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

        service = module.get<CurrentRoomMysqlGetter>(CurrentRoomMysqlGetter);
    });
    afterAll(async () => {
        await connection.end();
    });

    it('should return current room for valid room id and user id', async () => {
        const roomRepository = new RoomMysqlRepository(connection, {publish: jest.fn(), publishAll: jest.fn()});


        const roomId = RoomId.random();
        const userId = UserId.random();
        const otherUserId = UserId.random();

        const room = Room.create(roomId, userId, UserName.fromValue('randomName'), new Date('2021-01-01T00:00:00.000Z'));
        room.addUser(otherUserId, UserName.fromValue('randomName2'), new Date('2021-01-01T00:00:00.000Z'));
        await roomRepository.save(room);

        const currentRoom = await service.execute(roomId, userId);

        expect(currentRoom).toEqual({
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
        const roomRepository = new RoomMysqlRepository(connection, {publish: jest.fn(), publishAll: jest.fn()});

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

