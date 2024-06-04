import {User} from "./User";
import {UserId} from "../valueObjects/UserId";

export class Users {
    private users = new Map<string, User>();

    constructor(users: User[]) {
        this.users = new Map<string, User>(users.map(user => [user.id.value, user]));
    }

    get size() {
        return this.users.size;
    }

    findPlayerById(playerId: UserId) {
        return this.users.get(playerId.value);
    }

    removePlayer(playerId: UserId) {
        this.users.delete(playerId.value);
    }

    addUser(player: User) {
        this.users.set(player.id.value, player);
    }

    has(playerId: UserId) {
        return this.users.has(playerId.value);
    }

    [Symbol.iterator]() {
        return this.users.values();
    }

    removeIdleUsers(idleThresholdMilliseconds: number, currentDateTime: Date) {

        const idleUsers: User[] = [];

        for (const player of this.users.values()) {
            if (player.isIdle(idleThresholdMilliseconds, currentDateTime)) {
                idleUsers.push(player);
            }
        }

        for (const idleUser of idleUsers) {
            this.users.delete(idleUser.id.value);
        }

        return idleUsers;
    }

    toArray() {
        return Array.from(this.users.values());
    }
}
