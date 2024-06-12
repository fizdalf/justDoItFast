import {UuidValueObject} from "@org/core/shared/domain/UuidValueObject";
import {ValueObject} from "@org/core/shared/domain/ValueObject";

export class GameSessionId extends ValueObject<string> {
    private constructor(value: string) {
        super(new UuidValueObject(value).value);
    }

    static random(): GameSessionId {
        return new GameSessionId(UuidValueObject.random().value);
    }

    static fromValue(id: string) {
        return new GameSessionId(id);
    }
}
