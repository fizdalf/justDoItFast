import {GameSessionCreatedEvent} from "./game-session-created.event";

describe('GameSessionCreatedEvent', () => {
    it('should be defined', () => {
        expect(GameSessionCreatedEvent).toBeDefined();
    });

    it('should create an event', () => {
        const event = new GameSessionCreatedEvent(
            'aggregateId',
            'roomId',
            [{index: 0, playerName: 'player1', playerUserId: 'userId'}],
            ['wordPackId'],
            'status',
            new Date(),
            'eventId'
        );

        expect(event.aggregateId).toBe('aggregateId');
        expect(event.roomId).toBe('roomId');
        expect(event.seats).toEqual([{index: 0, playerName: 'player1', playerUserId: 'userId'}]);
        expect(event.wordPackIds).toEqual(['wordPackId']);
        expect(event.status).toBe('status');
        expect(event.occurredOn).toBeDefined();
        expect(event.eventId).toBe('eventId');
    });

    it('should create an event from primitives', () => {
        const event = GameSessionCreatedEvent.fromPrimitives({
            aggregateId: 'aggregateId',
            eventId: 'eventId',
            occurredOn: new Date(),
            attributes: {
                roomId: 'roomId',
                seats: [{index: 0, playerName: 'player1', playerUserId: 'userId'}],
                wordPackIds: ['wordPackId'],
                status: 'status'
            }
        });

        expect(event.aggregateId).toBe('aggregateId');
        expect(event.roomId).toBe('roomId');
        expect(event.seats).toEqual([{index: 0, playerName: 'player1', playerUserId: 'userId'}]);
        expect(event.wordPackIds).toEqual(['wordPackId']);
        expect(event.status).toBe('status');
        expect(event.occurredOn).toBeDefined();
        expect(event.eventId).toBe('eventId');
    });

    it('should return event attributes', () => {
        const event = new GameSessionCreatedEvent(
            'aggregateId',
            'roomId',
            [{index: 0, playerName: 'player1', playerUserId: 'userId'}],
            ['wordPackId'],
            'status',
            new Date(),
            'eventId'
        );

        expect(event.toPrimitives()).toEqual({
            roomId: 'roomId',
            seats: [{index: 0, playerName: 'player1', playerUserId: 'userId'}],
            wordPackIds: ['wordPackId'],
            status: 'status'
        });
    });

});
