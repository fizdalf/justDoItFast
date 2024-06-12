import {UserId} from "../../../room/domain/value-objects/UserId";


export class Player {
    constructor(
        public readonly id: UserId,
        public readonly name: string,
    ) {
    }
}
