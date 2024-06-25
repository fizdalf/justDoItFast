import {Seats} from "./Seats";
import {UserId} from "../../../room/domain/value-objects/UserId";
import {Player} from "./Player";
import {Seat} from "./Seat";
import {PlayerAlreadyInGameError} from "../exceptions/PlayerAlreadyInGameError";

describe('Seats', () => {
    it('should be defined', () => {
        expect(Seats).toBeDefined();
    });

    it('should create seats', () => {
        const seat = new Seat(0, new Player(UserId.random(), 'player1'));
        const seats = new Seats(seat);

        const result = seats.toArray();

        expect(result.length).toBe(1);
        expect(result[0]).toBe(seat);

    });

    it('should add player', () => {
        const seats = new Seats();

        const userId = UserId.random();
        seats.add(new Player(userId, 'player1'));

        const result = seats.toArray();

        expect(result.length).toBe(1);
        expect(result[0].player.name).toBe('player1');
        expect(result[0].player.id).toBe(userId);
    });

    it('should throw error if player already in game', () => {
        const seats = new Seats();
        const userId = UserId.random();
        seats.add(new Player(userId, 'player1'));

        expect(() => seats.add(new Player(userId, 'player2'))).toThrow(PlayerAlreadyInGameError);
    });
});
