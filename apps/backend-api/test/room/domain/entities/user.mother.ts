import {User, UserProps} from "../../../../src/room/domain/entities/User";
import {UserId} from "../../../../src/room/domain/value-objects/UserId";
import {UserNameMother} from "../value-objects/user-name.mother";
import {UserLastContactedAtMother} from "../value-objects/user-last-contacted-at.mother";


export class UserMother {
    static create({id, name, lastContactedAt}: Partial<UserProps> | undefined = {}): User {
        return new User({
            id: id ?? UserId.random(),
            name: name ?? UserNameMother.create(),
            lastContactedAt: lastContactedAt ?? UserLastContactedAtMother.create()
        });
    }
}
