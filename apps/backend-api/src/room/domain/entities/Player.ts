import {PlayerId} from '../valueObjects/PlayerId';
import {PlayerName} from '../valueObjects/PlayerName';
import {PlayerLastContactedAt} from '../valueObjects/playerLastContactedAt';

export interface PlayerParams {
    id: PlayerId;
    name: PlayerName;
    lastContactedAt: PlayerLastContactedAt;
}

export class Player {
    private readonly _id: PlayerId;
    private readonly _name: PlayerName;
    constructor({id, name, lastContactedAt}: PlayerParams) {
        this._id = id;
        this._name = name;
        this._lastContactedAt = lastContactedAt;
    }

    private _lastContactedAt: PlayerLastContactedAt;

    get lastContactedAt(): PlayerLastContactedAt {
        return this._lastContactedAt;
    }

    get name(): PlayerName {
        return this._name;
    }

    get id(): PlayerId {
        return this._id;
    }

    isIdle(idleThresholdMilliseconds: number, now: Date): boolean {
        return this._lastContactedAt.isIdle(idleThresholdMilliseconds, now);
    }

    registerContact() {
        this._lastContactedAt = this._lastContactedAt.registerContact();
    }
}
