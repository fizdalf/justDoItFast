import {UuidValueObject} from "@org/core/shared/domain/UuidValueObject";


export class WordPackId extends UuidValueObject {

    static fromValue(value: string): WordPackId {
        return new WordPackId(value);
    }

    static random() {
        return new WordPackId(this.randomUuid());
    }
}
