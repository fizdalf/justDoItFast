export class ValueObject<T> {
    public readonly value: T;

    constructor(value: T) {
        this.value = value;
    }

    equals(other: any): boolean {
        if (other instanceof ValueObject) {
            return this.value === other.value;
        }
        return false;
    }
}
