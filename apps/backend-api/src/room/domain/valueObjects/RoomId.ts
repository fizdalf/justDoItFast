import {uuidv7} from 'uuidv7';
import {UuidValueObject} from '@org/core/shared/domain/UuidValueObject';

export class RoomId extends UuidValueObject {
    static fromValue(value: string): RoomId {
        return new this(value);
    }

    static random() {
        return new this(uuidv7())
    }
}

