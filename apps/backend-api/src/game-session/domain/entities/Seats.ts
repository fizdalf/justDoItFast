import {Seat} from "./Seat";

import {Player} from "./Player";
import {UserId} from "../../../room/domain/value-objects/UserId";
import {PlayerAlreadyInGameError} from "../exceptions/PlayerAlreadyInGameError";

export class Seats {
    private readonly seats: Seat[];
    private readonly players: Set<UserId> = new Set<UserId>();

    constructor(...seats: Seat[]) {
        this.seats = seats;
        seats.forEach(seat => this.players.add(seat.player.id));
    }

    add(player: Player) {
        if (this.players.has(player.id)) {
            throw new PlayerAlreadyInGameError();
        }
        const seat = new Seat(this.seats.length, player);
        this.seats.push(seat);
        this.players.add(player.id);
    }

    toArray() {
        return [...this.seats];
    }
}
