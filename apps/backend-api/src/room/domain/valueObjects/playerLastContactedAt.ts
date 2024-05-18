import {ValueObject} from '@org/core/shared/domain/ValueObject';

export class PlayerLastContactedAt extends ValueObject<Date> {
    static create(value: Date): PlayerLastContactedAt {
        return new PlayerLastContactedAt(value);
    }

    isIdle(idleThresholdMilliseconds: number, now: Date): boolean {
        const timeDifference = now.getTime() - this.value.getTime();
        return timeDifference > idleThresholdMilliseconds;
    }

    registerContact() {
        return PlayerLastContactedAt.create(new Date());
    }
}
