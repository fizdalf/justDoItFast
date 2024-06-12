import {UuidValueObject} from '@org/core/shared/domain/UuidValueObject';
import {ValueObject} from "@org/core/shared/domain/ValueObject";

export class TeamId extends ValueObject<string> {

    private constructor(value: string) {
        super(new UuidValueObject(value).value);
    }

    static fromValue(value: string): TeamId {
        return new TeamId(value);
    }

    static random(): TeamId {
        return new TeamId(UuidValueObject.random().value);
    }
}
