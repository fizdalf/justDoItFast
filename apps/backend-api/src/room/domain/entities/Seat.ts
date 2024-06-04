import {User} from "./User";
import {Team} from "./Team";

export class Seat {
    constructor(readonly index: number,
                readonly player: User,
                readonly team: Team
    ) {
    }
}
