import {faker} from "@faker-js/faker";
import {UserLastContactedAt} from "../../../../src/room/domain/value-objects/userLastContactedAt";


export class UserLastContactedAtMother {
    static create(value?: Date): UserLastContactedAt {
        return UserLastContactedAt.create(value ?? faker.date.anytime());
    }
}
