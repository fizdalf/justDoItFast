import {GameSessionId} from '../valueObjects/GameSessionId';
import {PlayerId} from '../valueObjects/PlayerId';
import {TeamId} from '../valueObjects/TeamId';
import {Team} from '../entities/Team';
import {Player} from '../entities/Player';
import {AggregateRoot} from '@nestjs/cqrs';
import {GameSessionCreatedDomainEvent} from '../events/game-session-created.event';
import {GameSessionPlayerJoinedEvent} from '../events/game-session-player-joined.event';

export interface GameSessionParams {
    id: GameSessionId;
    teams: Team[];
    host: PlayerId;
    createdAt: Date;
    updatedAt: Date;
}

export class GameSession extends AggregateRoot {
    readonly id: GameSessionId;
    readonly teams: Team[];
    readonly host: PlayerId;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    constructor({id, teams, host, createdAt, updatedAt}: GameSessionParams) {
        super();
        this.id = id;
        this.teams = teams;
        this.host = host;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;

    }


    addPlayer(player: Player) {
        const team = this.findTeamWithFewestPlayers();
        team.addPlayer(player);
        this.apply(new GameSessionPlayerJoinedEvent(this.id.value, player.id.value, player.name.value));
    }

    private findTeamWithFewestPlayers() {
        return this.teams.reduce((acc, team) => {
            if (!acc || team.players.length < acc.players.length) {
                return team;
            }
            return acc;
        });
    }

    totalPlayerCount() {
        return this.teams.reduce((acc, team) => acc + team.players.length, 0);
    }

    static create(host: Player, sessionId: GameSessionId): GameSession {
        let redTeam = new Team(
            TeamId.random(),
            [],
        );


        redTeam.addPlayer(host)

        let blueTeam = new Team(
            TeamId.random(),
            [],
        );
        const instance = new GameSession(
            {
                id: sessionId,
                host: host.id,
                teams: [
                    redTeam,
                    blueTeam
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        );
        instance.apply(new GameSessionCreatedDomainEvent(instance.id.value, instance.host.value));
        return instance;
    }

    removePlayer(playerId: PlayerId) {
        this.teams.forEach(team => {
            team.removePlayer(playerId)
        });
    }

    isPlayerInSession(playerId: PlayerId): boolean {
        return this.teams.some(team => team.players.some(player => player.id.equals(playerId)));
    }

    hostPlayerName() {
        return this.teams.find(team => team.players.some(player => player.id.equals(this.host)))?.players.find(player => player.id.equals(this.host))?.name;
    }
}
