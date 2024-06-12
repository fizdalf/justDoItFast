import {Users} from "../../../../src/room/domain/entities/Users";
import {User} from "../../../../src/room/domain/entities/User";
import {UserMother} from "../entities/user.mother";


export class UsersMother {
    static create(users?: User[] | undefined): Users {
        return new Users(users ?? UsersMother.createSomeUsers());
    }

    private static createSomeUsers() {
        const users: User[] = [];
        for (let i = 0; i < Math.floor(Math.random() * 10 + 1); i++) {
            users.push(UserMother.create());
        }
        return users;
    }
}
