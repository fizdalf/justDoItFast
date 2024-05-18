import {ValueObject} from '@org/core/shared/domain/ValueObject';

export class PlayerName extends ValueObject<string> {

    private constructor(value: string) {
        super(value);
    }

    static fromValue(value: string): PlayerName {
        return new PlayerName(value);
    }
}
