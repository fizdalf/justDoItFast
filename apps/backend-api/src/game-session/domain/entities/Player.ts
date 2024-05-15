import {PlayerId} from '../valueObjects/PlayerId';
import {PlayerName} from '../valueObjects/PlayerName';

export interface PlayerParams {
    id: PlayerId;
    name: PlayerName;
}

export class Player {
    private readonly _id: PlayerId;
    private readonly _name: PlayerName;

    constructor({id, name}: PlayerParams) {
        this._id = id;
        this._name = name;
    }

    get name(): PlayerName {
        return this._name;
    }

    get id(): PlayerId {
        return this._id;
    }
}
