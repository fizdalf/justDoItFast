import {User} from './User';
import {UserId} from '../valueObjects/UserId';
import {UserName} from '../valueObjects/UserName';
import {UserLastContactedAt} from '../valueObjects/userLastContactedAt';

describe('User', () => {
    it('should be defined', () => {
        expect(User).toBeDefined();
    });

    it('should create a player', () => {
        const props = {
            id: UserId.random(),
            name: UserName.fromValue('player1'),
            lastContactedAt: UserLastContactedAt.create(new Date()),
        };
        const player = new User(props);

        expect(player).toBeDefined();
        expect(player).toEqual({
            _id: props.id,
            _name: props.name,
            _lastContactedAt: props.lastContactedAt

        })
    });

    it('should register contact', () => {
        const userProps = {
            id: UserId.random(),
            name: UserName.fromValue('player1'),
            lastContactedAt: UserLastContactedAt.create(new Date('2021-01-01 10:30:00')),
        };
        const player = new User(userProps);
        expect(player).toEqual({
            _id: userProps.id,
            _name: userProps.name,
            _lastContactedAt: userProps.lastContactedAt
        });
        const newContactDate = new Date('2022-01-01 10:30:00');
        player.registerContact(newContactDate);


        expect(player).toEqual({
            _id: userProps.id,
            _name: userProps.name,
            _lastContactedAt: UserLastContactedAt.create(newContactDate)
        });
    });

    it('should not consider player idle, if last contacted date is less or equals threshold milliseconds ago', () => {
        const player = new User({
            id: UserId.random(),
            name: UserName.fromValue('player1'),
            lastContactedAt: UserLastContactedAt.create(new Date('2021-01-01 10:30:00')),
        });

        const TWO_MINUTES = 1000 * 60 * 2;
        expect(player.isIdle(TWO_MINUTES, new Date('2021-01-01 10:31:59'))).toBe(false);
        expect(player.isIdle(TWO_MINUTES, new Date('2021-01-01 10:32:00'))).toBe(false);

    });

    it('should consider player idle, if last contacted date was more than threshold milliseconds ago', () => {
        const player = new User({
            id: UserId.random(),
            name: UserName.fromValue('player1'),
            lastContactedAt: UserLastContactedAt.create(new Date('2021-01-01 10:30:00')),
        });

        const TWO_MINUTES = 1000 * 60 * 2;
        expect(player.isIdle(TWO_MINUTES, new Date('2021-01-01 10:32:01'))).toBe(true);
    });
})
