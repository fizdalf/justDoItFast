import {Player} from "./Player";

export class Seat {
    constructor(readonly index: number,
                readonly player: Player,
    ) {
    }
}
