import {UUID} from 'uuidv7';
import {ValueObject} from '@org/core/shared/domain/ValueObject';


export abstract class UuidValueObject extends ValueObject<string> {

    protected constructor(value: string) {
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
}
