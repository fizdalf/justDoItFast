import {uuidv7} from 'uuidv7';
import {UuidValueObject} from '@org/core/shared/domain/UuidValueObject';

export class PlayerId extends UuidValueObject {

    static fromValue(value: string): PlayerId {
        return new PlayerId(value);
    }

    static random() {
        return new PlayerId(uuidv7());
    }
}
