import {uuidv7} from 'uuidv7';
import {UuidValueObject} from '@org/core/shared/domain/UuidValueObject';

export class UserId extends UuidValueObject {

    static fromValue(value: string): UserId {
        return new UserId(value);
    }

    static random() {
        return new UserId(uuidv7());
    }
}
