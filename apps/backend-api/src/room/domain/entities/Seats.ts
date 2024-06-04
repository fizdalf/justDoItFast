import {Seat} from "./Seat";
import {User} from "./User";
import {Team} from "./Team";

export class Seats {
    private seats: Seat[];
    private players: Set<User> = new Set<User>();

    constructor(...seats: Seat[]) {
        this.seats = seats;
        seats.forEach(seat => this.players.add(seat.player));
    }

    add(player: User, team: Team) {
        if (this.players.has(player)) {
            throw new Error('Player already in game');
        }
        if(!team.isMember(player.id)){
            throw new Error('Player does not belong to any team');
        }
        const seat = new Seat(this.seats.length, player, team);
        this.seats.push(seat);
        this.players.add(player);
    }
}
