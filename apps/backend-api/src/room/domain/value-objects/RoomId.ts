import {UuidValueObject} from '@org/core/shared/domain/UuidValueObject';
import {ValueObject} from "@org/core/shared/domain/ValueObject";

export class RoomId extends ValueObject<string> {

    private constructor(value: string) {
        super(new UuidValueObject(value).value);
    }

    static fromValue(value: string): RoomId {
        return new RoomId(value);
    }

    static random() {
        return new RoomId(UuidValueObject.random().value);
    }
}

