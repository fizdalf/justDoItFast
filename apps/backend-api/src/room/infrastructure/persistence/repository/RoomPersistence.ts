import {Room} from "../../../domain/aggregateRoots/Room";
import {TeamPersistence, TeamPersistenceData} from "./TeamPersistence";

import {UserPersistence, UserPersistenceData} from "./UserPersistence";


export type RoomPersistenceData = {
    createdAt: Date;
    gameSessionId: string;
    host: string;
    id: string;
    teams: TeamPersistenceData[];
    updatedAt: Date;
    users: UserPersistenceData[]
};

export class RoomPersistence extends Room {


    public constructor(room: Room) {
        super(room);

    }

    public toPersistence(): RoomPersistenceData {
        return {
            id: this._id.value,
            teams: this._teams.toArray().map(team => new TeamPersistence(team).toPersistence()),
            createdAt: this._createdAt,
            gameSessionId: this._gameSessionId.value,
            host: this._host.value,
            updatedAt: this._updatedAt,
            users: this._users.toArray().map(user => new UserPersistence(user).toPersistence()),
        }
    }
}
