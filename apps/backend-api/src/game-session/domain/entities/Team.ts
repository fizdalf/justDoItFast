import {TeamId} from '../valueObjects/TeamId';
import {PlayerId} from '../valueObjects/PlayerId';
import {Player} from './Player';

export class Team {
    id: TeamId;
    players: Player[];

    constructor(id: TeamId, players: Player[]) {
        this.id = id;
        this.players = players;

    }

    addPlayer(player: Player): void {
        this.players.push(player);

    };

    removePlayer(playerId: PlayerId) {
        this.players = this.players.filter(player => player.id.value !== playerId.value);
    }
}
