import {Team} from "./Team";
import {UserId} from "../valueObjects/UserId";
import {User} from "./User";
import {Seats} from "./Seats";

export class Teams {
    private readonly teams: Team[];

    constructor(...teams: Team[]) {
        this.teams = teams;
    }

    removePlayer(playerId: UserId) {
        this.teams.forEach(team => team.removeMember(playerId));
    }

    addMember(user: User) {
        const team = this.findTeamWithFewestPlayers();
        team.addMember(user);
        return team;
    }

    removeIdleMembersFromTeams(idleUserIds: UserId[]) {
        this.teams.forEach(team => {
            for (const idleUserId of idleUserIds) {
                team.removeMember(idleUserId);
            }
        });
        this.rebalanceTeams();
    }

    toArray() {
        return this.teams;
    }

    createSeats(playerIds: UserId[]) {

        if(!this.areTeamsBalanced()){
            throw new Error('Teams are not balanced');
        }

        if(playerIds.length !== this.totalPlayerCount()){
            throw new Error('Number of players does not match the total number of players in the teams');
        }

        const seats = new Seats();

        let lastTeam = undefined;
        for (const  playerId of playerIds) {
            const teamOfPlayer = this.teams.find(team => team.isMember(playerId));
            if (!teamOfPlayer) {
                throw new Error('Player does not belong to any team');
            }
            if (lastTeam && lastTeam === teamOfPlayer) {
                throw new Error('Players do not alternate teams');
            }
            const player = teamOfPlayer.getMember(playerId);
            lastTeam = teamOfPlayer;
            seats.add(player, teamOfPlayer)
        }

        return seats;
    }

    private findTeamWithFewestPlayers() {
        return this.teams.reduce((previousTeam, team) => {
            if (!previousTeam || team.memberCount < previousTeam.memberCount) {
                return team;
            }
            return previousTeam;
        });
    }

    private rebalanceTeams() {
        const totalPlayerCount = this.totalPlayerCount();
        const idealNumberOfPlayers = Math.floor(totalPlayerCount / this.teams.length);
        const playersToMove = this.teams.reduce((acc, team) => {
            if (team.memberCount > idealNumberOfPlayers) {
                return team.removeExtraMembers(idealNumberOfPlayers);
            }
            return acc;
        }, []);

        for (let i = 0; i < playersToMove.length; i++) {
            const player = playersToMove[i];
            const team = this.findTeamWithFewestPlayers();
            team.addMember(player);
        }
    }

    private totalPlayerCount() {
        return this.teams.reduce((acc, team) => acc + team.memberCount, 0);
    }

    private areTeamsBalanced() {
        const totalPlayerCount = this.totalPlayerCount();
        const idealNumberOfPlayers = Math.floor(totalPlayerCount / this.teams.length);
        return this.teams.every(team => team.memberCount === idealNumberOfPlayers);
    }
}
