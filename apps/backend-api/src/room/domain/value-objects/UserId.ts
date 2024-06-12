import {UuidValueObject} from '@org/core/shared/domain/UuidValueObject';
import {ValueObject} from "@org/core/shared/domain/ValueObject";

export class UserId extends ValueObject<string> {

    constructor(value: string) {
        super(new UuidValueObject(value).value);
    }

    static fromValue(value: string): UserId {
        return new UserId(value);
    }

    static random() {
        return new UserId(UuidValueObject.random().value);
    }
}
