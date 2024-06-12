import {Player} from "./Player";

export class Seat {
    constructor(readonly index: number,
                readonly player: Player,
    ) {
    }

    toPrimitives() {
        return {
            index: this.index,
            player: {
                id: this.player.id.value,
                name: this.player.name,
            }
        };
    }
}
