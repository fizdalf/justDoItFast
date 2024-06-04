import {ValueObject} from '@org/core/shared/domain/ValueObject';

export class UserLastContactedAt extends ValueObject<Date> {
    static create(value: Date): UserLastContactedAt {
        return new UserLastContactedAt(value);
    }

    isIdle(idleThresholdMilliseconds: number, now: Date): boolean {
        const timeDifference = now.getTime() - this.value.getTime();
        return timeDifference > idleThresholdMilliseconds;
    }

    registerContact(contactedAt: Date): UserLastContactedAt {
        return new UserLastContactedAt(contactedAt);
    }
}
