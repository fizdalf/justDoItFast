import {Users} from "../../../../src/room/domain/entities/Users";
import {User} from "../../../../src/room/domain/entities/User";
import {UserMother} from "../entities/user.mother";


export class UsersMother {
    static create(users?: User[] | undefined): Users {
        if (users == undefined) {
            return UsersMother.createSomeUsers();
        }

        return new Users(users);
    }

    static with(number: number) {
        const users: User[] = [];
        for (let i = 0; i < number; i++) {
            users.push(UserMother.create());
        }
        return new Users(users);
    }

    private static createSomeUsers(minimum: number = undefined) {
        const totalUsers = Math.floor(Math.random() * 10) + minimum ?? 1;
        return this.with(totalUsers);
    }
}
