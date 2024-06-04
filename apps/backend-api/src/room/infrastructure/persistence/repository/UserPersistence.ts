import {User} from "../../../domain/entities/User";


export type UserPersistenceData = { name: string; lastContactedAt: Date; id: string };

export class UserPersistence extends User {

    constructor(user: User) {
        super(user);
    }

    toPersistence(): UserPersistenceData {
        return {
            id: this._id.value,
            name: this._name.value,
            lastContactedAt: this._lastContactedAt.value,
        }
    }
}
