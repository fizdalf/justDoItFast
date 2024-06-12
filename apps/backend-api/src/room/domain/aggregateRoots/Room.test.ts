import {Room,} from './Room';
import {RoomId} from "../value-objects/RoomId";
import {UserId} from "../value-objects/UserId";
import {UserName} from "../value-objects/UserName";
import {Users} from "../entities/Users";
import {User} from "../entities/User";
import {UserLastContactedAt} from "../value-objects/userLastContactedAt";
import {RoomCreatedEvent} from "../events/room-created.event";
import {RoomUserJoinedEvent} from "../events/room-user-joined.event";
import {RoomUserContactRegisteredEvent} from "../events/room-user-contact-registered.event";
import {RoomUserLeftEvent} from "../events/room-user-left.event";


describe("Room", () => {

    beforeEach(() => {

    });

    it("should create a room", () => {
        let roomId = RoomId.random();
        let userId = UserId.random();
        let userName = UserName.random();
        let currDate = new Date();

        const room = Room.create(roomId, userId, userName, currDate);
        expect(room).toBeInstanceOf(Room);
        expect(room.getUncommittedEvents()).toMatchObject(
            [
                {
                    "occurredOn": currDate,
                    "hostId": userId.value,
                    "hostName": userName.value,
                    "hostTeamId": expect.any(String),
                    "otherTeamId": expect.any(String),
                    "aggregateId": roomId.value,
                    "eventName": RoomCreatedEvent.EVENT_NAME
                }
            ]
        );
    });

    it("should add a player", () => {
        const room = Room.create(RoomId.random(), UserId.random(), UserName.random(), new Date());
        room.commit();
        const newUserId = UserId.random();
        const newUserName = UserName.random();
        room.addUser(newUserId, newUserName, new Date());
        expect(room.getUncommittedEvents()).toMatchObject(
            [
                {
                    "occurredOn": expect.any(Date),
                    "aggregateId": expect.any(String),
                    "userId": newUserId.value,
                    "userName": newUserName.value,
                    "eventName": RoomUserJoinedEvent.EVENT_NAME
                }
            ]
        )
    });

    it("should remove a player", () => {
        const userId = UserId.random();
        const date = new Date();
        const roomId = RoomId.random();
        const room = Room.create(roomId, userId, UserName.random(), date);
        room.addUser(UserId.random(), UserName.random(), date);
        room.commit();
        room.leave(userId, date);

        expect(room.getUncommittedEvents()).toMatchObject(
            [
                {
                    "occurredOn": date,
                    "aggregateId": roomId.value,
                    "userId": userId.value,
                    "eventName": RoomUserLeftEvent.EVENT_NAME,
                    "eventId": expect.any(String),
                }
            ]
        )
    });

    it("should register player contact", () => {
        let roomId = RoomId.random();
        let userId = UserId.random();
        let userName = UserName.random();
        let currDate = new Date();

        let roomParams = {
            id: roomId,
            teams: [],
            host: userId,
            createdAt: currDate,
            updatedAt: currDate,
            gameSessionId: undefined,
            users: new Users([new User({
                id: userId,
                name: userName,
                lastContactedAt: UserLastContactedAt.create(currDate)
            })])
        };
        const room = new Room(roomParams);
        const lastContactedAtDate = new Date();
        room.registerUserContact(userId, lastContactedAtDate);
        expect(room.getUncommittedEvents()).toMatchObject(
            [
                {
                    "occurredOn": expect.any(Date),
                    "aggregateId": roomId.value,
                    "userId": userId.value,
                    "lastContactedAt": lastContactedAtDate.toISOString(),
                    "eventName": RoomUserContactRegisteredEvent.EVENT_NAME
                }
            ]
        );

    });

    it("should remove idle users", () => {
        const roomId = RoomId.random();
        const userId = UserId.random();
        const userName = UserName.random();
        const currDate = new Date('2021-01-01T00:00:00.000Z');

        const roomParams = {
            id: roomId,
            teams: [],
            host: userId,
            createdAt: currDate,
            updatedAt: currDate,
            gameSessionId: undefined,
            users: new Users([
                    new User({
                        id: userId,
                        name: userName,
                        lastContactedAt: UserLastContactedAt.create(currDate)
                    })
                ]
            )
        };
        const room = new Room(roomParams);


        room.removeIdleUsers(new Date('2021-01-01T00:30:00.000Z'));

        expect(room.getUncommittedEvents()).toMatchObject(
            [
                {
                    "occurredOn": expect.any(Date),
                    "aggregateId": roomId.value,
                    "userId": userId.value,
                    "eventName": RoomUserLeftEvent.EVENT_NAME,
                    "eventId": expect.any(String),
                }
            ]
        )
    });

});
