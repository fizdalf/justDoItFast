import {UserLastContactedAt} from './userLastContactedAt';

describe('PlayerLastContactedAt', () => {
    it('should be defined', () => {
        expect(UserLastContactedAt).toBeDefined();
    });

    it('should create a last contacted at', () => {
        const lastContactedAt = UserLastContactedAt.create(new Date());

        expect(lastContactedAt).toBeDefined();
        expect(lastContactedAt.value).not.toBeNull();
    });

    it('should register contact', () => {
        const lastContactedAt = UserLastContactedAt.create(new Date());

        const newLastContactedAt = lastContactedAt.registerContact();

        expect(newLastContactedAt.value).not.toBeNull();
    });

    it('should not consider player idle, if last contacted date is less or equals threshold milliseconds ago', () => {
        const lastContactedAt = UserLastContactedAt.create(new Date('2021-01-01 10:30:00'));

        const TWO_MINUTES = 1000 * 60 * 2;
        expect(lastContactedAt.isIdle(TWO_MINUTES, new Date('2021-01-01 10:31:59'))).toBe(false);
        expect(lastContactedAt.isIdle(TWO_MINUTES, new Date('2021-01-01 10:32:00'))).toBe(false);
    });

    it('should consider player idle, if last contacted date was more than threshold milliseconds ago', () => {
        const lastContactedAt = UserLastContactedAt.create(new Date('2021-01-01 10:30:00'));

        const TWO_MINUTES = 1000 * 60 * 2;
        expect(lastContactedAt.isIdle(TWO_MINUTES, new Date('2021-01-01 10:32:01'))).toBe(true);
    });

});
