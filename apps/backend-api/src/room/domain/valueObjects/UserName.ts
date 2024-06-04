import {ValueObject} from '@org/core/shared/domain/ValueObject';

export class UserName extends ValueObject<string> {

    private constructor(value: string) {
        super(value);
    }

    static fromValue(value: string): UserName {
        return new UserName(value);
    }

    static random() {
        return UserName.fromValue('random');
    }
}
