import {Room,} from './Room';
import {RoomId} from "../value-objects/RoomId";
import {UserId} from "../value-objects/UserId";
import {UserName} from "../value-objects/UserName";
import {User} from "../entities/User";
import {UserLastContactedAt} from "../value-objects/userLastContactedAt";
import {RoomCreatedEvent} from "../events/room-created.event";
import {RoomUserJoinedEvent} from "../events/room-user-joined.event";
import {RoomUserContactRegisteredEvent} from "../events/room-user-contact-registered.event";
import {RoomUserLeftEvent} from "../events/room-user-left.event";
import {UserMother} from "../../../../test/room/domain/entities/user.mother";
import {RoomMother} from "../../../../test/room/domain/aggregateRoots/room.mother";
import {RoomHostChangedEvent} from "../events/room-host-changed.event";
import {RoomEmptiedEvent} from "../events/room-emptied.event";


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
                    "aggregateId": roomId.value,
                    "eventName": RoomCreatedEvent.EVENT_NAME
                }
            ]
        );
    });

    it("should add a user", () => {
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

    it("should remove a user", () => {
        const existingUser = UserMother.create();

        const roomId = RoomId.random();
        const leavingUser = UserMother.create();
        const room = RoomMother.create(
            {
                id: roomId,
                host: existingUser.id,
                users: [
                    existingUser,
                    leavingUser
                ]
            }
        );

        room.leave(leavingUser.id);

        expect(room.getUncommittedEvents()).toMatchObject(
            [
                {
                    "aggregateId": roomId.value,
                    "userId": leavingUser.id.value,
                    "eventName": RoomUserLeftEvent.EVENT_NAME,
                    "eventId": expect.any(String),
                }
            ]
        )
    });

    it("should register user contact", () => {
        let roomId = RoomId.random();
        let userId = UserId.random();
        let userName = UserName.random();
        let currDate = new Date();

        let roomParams = {
            id: roomId,
            host: userId,
            createdAt: currDate,
            updatedAt: currDate,
            users: [new User({
                id: userId,
                name: userName,
                lastContactedAt: UserLastContactedAt.create(currDate)
            })]
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
        const toRemoveUserId = UserId.random();

        const room = RoomMother.create({
            id: roomId,
            host: userId,
            users: [
                UserMother.create({
                    id: userId,
                    lastContactedAt: UserLastContactedAt.create(new Date('2021-01-01T00:30:00.000Z'))
                }),
                UserMother.create({
                    id: toRemoveUserId,
                    lastContactedAt: UserLastContactedAt.create(new Date('2021-01-01T00:00:00.000Z'))
                })
            ]
        });

        room.removeIdleUsers(new Date('2021-01-01T00:30:00.000Z'));

        expect(room.getUncommittedEvents()).toMatchObject(
            [
                {
                    "occurredOn": expect.any(Date),
                    "aggregateId": roomId.value,
                    "userId": toRemoveUserId.value,
                    "eventName": RoomUserLeftEvent.EVENT_NAME,
                    "eventId": expect.any(String),
                }
            ]
        )
    });

    it('should replace host when host is idle', () => {
        const roomId = RoomId.random();
        const toBeHost = UserMother.create({
            id: UserId.random(),
            lastContactedAt: UserLastContactedAt.create(new Date('2021-01-01T00:30:00.000Z'))
        });
        const idleHostUser = UserMother.create({
            id: UserId.random(),
            lastContactedAt: UserLastContactedAt.create(new Date('2021-01-01T00:00:00.000Z'))
        });
        const room = RoomMother.create({
            id: roomId,
            host: idleHostUser.id,
            users: [
                idleHostUser,
                toBeHost
            ]
        });

        room.removeIdleUsers(new Date('2021-01-01T00:30:00.000Z'));

        expect(room.getUncommittedEvents()).toMatchObject(
            [
                {
                    "occurredOn": expect.any(Date),
                    "aggregateId": roomId.value,
                    "userId": idleHostUser.id.value,
                    "eventName": RoomUserLeftEvent.EVENT_NAME,
                    "eventId": expect.any(String),
                },
                {
                    "aggregateId": roomId.value,
                    "newHostId": toBeHost.id.value,
                    "eventName": RoomHostChangedEvent.EVENT_NAME,
                    "eventId": expect.any(String),
                }
            ]
        )

    });

    it('should replace host when host leaves', () => {

        const roomId = RoomId.random();
        const userId = UserId.random();
        const newHostId = UserId.random();
        const date = new Date();

        const room = RoomMother.create({
            id: roomId,
            host: userId,
            users: [
                UserMother.create({
                    id: userId,
                    lastContactedAt: UserLastContactedAt.create(date)
                }),
                UserMother.create({
                    id: newHostId,
                    lastContactedAt: UserLastContactedAt.create(date)
                })
            ]
        });

        room.leave(userId);

        expect(room.getUncommittedEvents()).toMatchObject(
            [
                {
                    "aggregateId": roomId.value,
                    "userId": userId.value,
                    "eventName": RoomUserLeftEvent.EVENT_NAME,
                    "eventId": expect.any(String),
                },
                {
                    "aggregateId": roomId.value,
                    "newHostId": newHostId.value,
                    "eventName": RoomHostChangedEvent.EVENT_NAME,
                    "eventId": expect.any(String),
                }
            ]
        )
    });

    it('should inform room is empty when everybody leaves', () => {

        const roomId = RoomId.random();
        const users = UserMother.createMany(2);

        const room = RoomMother.create({
            id: roomId,
            users: users
        });
        room.leave(users[0].id);
        room.commit();

        const lastUser = users[1];
        room.leave(lastUser.id);

        const events = room.getUncommittedEvents();

        expect(events).toHaveLength(2);
        expect(events[0]).toBeInstanceOf(RoomUserLeftEvent);

        expect(events[1]).toBeInstanceOf(RoomEmptiedEvent);
        expect((events[1] as RoomEmptiedEvent).aggregateId).toBe(roomId.value);

    });

});
