import {Player} from './Player';
import {PlayerId} from '../valueObjects/PlayerId';
import {PlayerName} from '../valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../valueObjects/playerLastContactedAt';

describe('Player', () => {
    it('should be defined', () => {
        expect(Player).toBeDefined();
    });

    it('should create a player', () => {
        const id = PlayerId.random();
        const player = new Player({
            id: id,
            name: PlayerName.fromValue('player1'),
            lastContactedAt: PlayerLastContactedAt.create(new Date()),
        });

        expect(player).toBeDefined();
        expect(player.id.value).toEqual(id.value);
        expect(player.name.value).toEqual('player1');
    });

    it('should register contact', () => {
        const player = new Player({
            id: PlayerId.random(),
            name: PlayerName.fromValue('player1'),
            lastContactedAt: PlayerLastContactedAt.create(new Date()),
        });

        player.registerContact();


        expect(player.lastContactedAt.value).not.toBeNull();
    });

    it('should not consider player idle, if last contacted date is less or equals threshold milliseconds ago', () => {
        const player = new Player({
            id: PlayerId.random(),
            name: PlayerName.fromValue('player1'),
            lastContactedAt: PlayerLastContactedAt.create(new Date('2021-01-01 10:30:00')),
        });

        const TWO_MINUTES = 1000 * 60 * 2;
        expect(player.isIdle(TWO_MINUTES, new Date('2021-01-01 10:31:59'))).toBe(false);
        expect(player.isIdle(TWO_MINUTES, new Date('2021-01-01 10:32:00'))).toBe(false);

    });

    it('should consider player idle, if last contacted date was more than threshold milliseconds ago', () => {
        const player = new Player({
            id: PlayerId.random(),
            name: PlayerName.fromValue('player1'),
            lastContactedAt: PlayerLastContactedAt.create(new Date('2021-01-01 10:30:00')),
        });

        const TWO_MINUTES = 1000 * 60 * 2;
        expect(player.isIdle(TWO_MINUTES, new Date('2021-01-01 10:32:01'))).toBe(true);
    });
})
