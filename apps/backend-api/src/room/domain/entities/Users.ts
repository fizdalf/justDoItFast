import {User} from "./User";
import {UserId} from "../value-objects/UserId";

export class Users {
    private users = new Map<string, User>();

    constructor(users: User[]) {
        this.users = new Map<string, User>(users.map(user => [user.id.value, user]));
    }

    get size() {
        return this.users.size;
    }

    findUserById(id: UserId) {
        return this.users.get(id.value);
    }

    remove(id: UserId) {
        return this.users.delete(id.value);
    }

    addUser(user: User) {
        this.users.set(user.id.value, user);
    }

    [Symbol.iterator]() {
        return this.users.values();
    }

    filter(predicate: (user: User) => boolean) {
        return Array.from(this.users.values()).filter(predicate);
    }

    toArray() {
        return Array.from(this.users.values());
    }

    first(): User {
        return this.users.values().next().value;
    }
}
