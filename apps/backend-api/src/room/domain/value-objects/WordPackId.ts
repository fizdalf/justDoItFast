import {UuidValueObject} from "@org/core/shared/domain/UuidValueObject";
import {ValueObject} from "@org/core/shared/domain/ValueObject";


export class WordPackId extends ValueObject<string> {

    private constructor(value: string) {
        super(new UuidValueObject(value).value);
    }

    static fromValue(value: string): WordPackId {
        return new WordPackId(value);
    }

    static random() {
        return new WordPackId(UuidValueObject.random().value);
    }
}
