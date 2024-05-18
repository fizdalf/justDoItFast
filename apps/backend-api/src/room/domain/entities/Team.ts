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

    removePlayer(playerId: PlayerId): boolean {
        if (!this.isPlayerInTeam(playerId)) {
            return false;
        }
        this.players = this.players.filter(player => player.id.value !== playerId.value);
        return true;
    }

    isPlayerInTeam(playerId: PlayerId): boolean {
        return this.players.some(player => player.id.value === playerId.value);
    }

    removeIdlePlayers() {
        const removedPlayers: Player[] = [];
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];

            if (player.isIdle(1000 * 60 * 2, new Date())) {
                removedPlayers.push(player);
                this.players.splice(i, 1);
                i--;
            }
        }
        return removedPlayers;
    }

    registerPlayerContact(playerId: PlayerId) {
        const player = this.players.find(player => player.id.value === playerId.value);
        if (!player) {
            return false;
        }
        player.registerContact();
        return true;
    }
}
