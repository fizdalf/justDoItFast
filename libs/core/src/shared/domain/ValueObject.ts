export abstract class ValueObject<T> {
    protected readonly _value: T;

    constructor(value: T) {
        this._value = value;
    }

    get value(): T {
        return this._value;
    }

    equals(other: any): boolean {
        if (other instanceof ValueObject) {
            return this._value === other._value;
        }
        return false;
    }
}
