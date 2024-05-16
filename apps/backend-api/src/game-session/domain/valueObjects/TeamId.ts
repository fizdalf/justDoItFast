import {uuidv7} from 'uuidv7';
import {UuidValueObject} from '@org/core/shared/domain/UuidValueObject';

export class TeamId extends UuidValueObject {

    private constructor(value: string) {
        super(value);
    }

    static fromValue(value: string): TeamId {
        return new TeamId(value);
    }

    static random() {
        return new TeamId(uuidv7())
    }
}
