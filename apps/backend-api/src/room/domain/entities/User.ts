import {UserId} from '../valueObjects/UserId';
import {UserName} from '../valueObjects/UserName';
import {UserLastContactedAt} from '../valueObjects/userLastContactedAt';

export interface UserProps {
    id: UserId;
    name: UserName;
    lastContactedAt: UserLastContactedAt;
}

export class User {
    protected readonly _id: UserId;
    protected readonly _name: UserName;
    protected _lastContactedAt: UserLastContactedAt;

    constructor({id, name, lastContactedAt}: UserProps) {
        this._id = id;
        this._name = name;
        this._lastContactedAt = lastContactedAt;
    }
    get name(): UserName {
        return this._name;
    }

    get id(): UserId {
        return this._id;
    }

    isIdle(idleThresholdMilliseconds: number, now: Date): boolean {
        return this._lastContactedAt.isIdle(idleThresholdMilliseconds, now);
    }

    registerContact(contactedAt: Date) {
        this._lastContactedAt = this._lastContactedAt.registerContact(contactedAt);
    }
}
