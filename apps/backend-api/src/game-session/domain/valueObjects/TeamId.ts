import {uuidv7} from 'uuidv7';
import {ValueObject} from '@org/core/shared/domain/ValueObject';
import {UuidValueObject} from '@org/core/shared/domain/UuidValueObject';

export class TeamId extends UuidValueObject {

    private constructor(value: string) {
        super(value);
    }

    static fromValue(value: string): ValueObject<string> {
        return new TeamId(value);
    }

    static random() {
        return new TeamId(uuidv7())
    }
}
