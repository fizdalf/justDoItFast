import {RoomId} from "../value-objects/RoomId";
import {UserId} from "../value-objects/UserId";
import {UserName} from "../value-objects/UserName";
import {RoomCreatedEvent} from "./room-created.event";


describe('RoomCreatedEvent', () => {

    it('should be defined', () => {
        expect(true).toBeDefined();
    });

    it('should create a new room created event', () => {

        // Arrange
        const id = RoomId.random();
        const hostId = UserId.random();
        const hostName = UserName.random();
        const currentDate = new Date();

        // Act
        const roomCreatedEvent = new RoomCreatedEvent({
            aggregateId: id.value,
            hostId: hostId.value,
            hostName: hostName.value,
            occurredOn: currentDate
        });

        // Assert
        expect(roomCreatedEvent).toBeDefined();

        expect(roomCreatedEvent).toMatchObject({
            aggregateId: id.value,
            hostId: hostId.value,
            hostName: hostName.value,
            occurredOn: currentDate,
            eventName: RoomCreatedEvent.EVENT_NAME
        });
    });

    it('should create a new room created event from primitives', () => {

        // Arrange
        const id = RoomId.random();
        const hostId = UserId.random();
        const hostName = UserName.random();
        const currentDate = new Date();

        // Act
        const roomCreatedEvent = RoomCreatedEvent.fromPrimitives({
            aggregateId: id.value,
            attributes: {
                hostId: hostId.value,
                hostName: hostName.value
            },
            eventId: 'event-id',
            occurredOn: currentDate
        });

        // Assert
        expect(roomCreatedEvent).toBeDefined();

        expect(roomCreatedEvent).toMatchObject({
            aggregateId: id.value,
            hostId: hostId.value,
            hostName: hostName.value,
            occurredOn: currentDate,
            eventName: RoomCreatedEvent.EVENT_NAME
        });
    });

    it('should return the primitives of the event', () => {

        // Arrange
        const id = RoomId.random();
        const hostId = UserId.random();
        const hostName = UserName.random();
        const currentDate = new Date();
        const roomCreatedEvent = new RoomCreatedEvent({
            aggregateId: id.value,
            hostId: hostId.value,
            hostName: hostName.value,
            occurredOn: currentDate
        });

        // Act
        const primitives = roomCreatedEvent.toPrimitives();

        // Assert
        expect(primitives).toMatchObject({
            hostId: hostId.value,
            hostName: hostName.value
        });
    });
});
