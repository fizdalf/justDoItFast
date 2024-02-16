export class SessionId {
    value: string;

    constructor(value: string) {
        this.value = value;
    }

    equals(other: any): boolean {
        if (other instanceof SessionId) {
            return this.value === other.value;
        }
        return false;
    }
}
