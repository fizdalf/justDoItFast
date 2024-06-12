import {UserName} from "../../../../src/room/domain/value-objects/UserName";
import {faker} from '@faker-js/faker';

export class UserNameMother {
    static create(value?: string): UserName {
        return UserName.fromValue(value ?? faker.person.firstName());
    }
}
