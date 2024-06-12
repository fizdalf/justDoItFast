import {UUID, uuidv7} from 'uuidv7';
import {ValueObject} from '@org/core/shared/domain/ValueObject';


export class UuidValueObject extends ValueObject<string> {

    constructor(value: string) {
        super(value);
        this.isValidUuid(value);
    }

    private isValidUuid(value: string) {
        try {
            UUID.parse(value);
        } catch (error) {
            throw new Error(`Invalid UUID: ${value}`);
        }
    }

    protected static randomUuid(): string {
        return uuidv7();
    }

    static random() {
        return new UuidValueObject(this.randomUuid());
    }
}
