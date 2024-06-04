import {Team} from "../../../domain/entities/Team";
import {UserPersistence} from "./UserPersistence";


export type TeamPersistenceData = { members: string[]; id: string };

export class TeamPersistence extends Team {

    constructor(team: Team) {
        super(team);

    }

    toPersistence(): TeamPersistenceData {
        return {
            id: this._id.value,
            members: this._members.map(player => new UserPersistence(player).toPersistence().id),
        }
    }
}
