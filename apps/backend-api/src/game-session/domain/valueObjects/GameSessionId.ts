import {uuidv7} from 'uuidv7';
import {UuidValueObject} from '@org/core/shared/domain/UuidValueObject';

export class GameSessionId extends UuidValueObject {
    static fromValue(value: string): GameSessionId {
        return new this(value);
    }

    static random() {
        return new this(uuidv7())
    }
}

