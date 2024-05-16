import {GameSessionId} from '../valueObjects/GameSessionId';
import {PlayerId} from '../valueObjects/PlayerId';
import {TeamId} from '../valueObjects/TeamId';
import {Team} from '../entities/Team';
import {Player} from '../entities/Player';
import {AggregateRoot} from '@nestjs/cqrs';
import {GameSessionCreatedDomainEvent} from '../events/game-session-created.event';
import {GameSessionPlayerJoinedEvent} from '../events/game-session-player-joined.event';
import {GameSessionPlayerLeftEvent} from '../events/game-session-player-left.event';
import {GameSessionEmptiedEvent} from '../events/game-session-emptied.event';
import {GameSessionPlayerContactRegisteredEvent} from '../events/game-session-player-contact-registered.event';
import {GameSessionHostChangedEvent} from '../events/game-session-host-changed-event';

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
    constructor({id, teams, host, createdAt, updatedAt}: GameSessionParams) {
        super();
        this.id = id;
        this.teams = teams;
        this._host = host;
        this.createdAt = createdAt;
        this._updatedAt = updatedAt;

    }
    readonly createdAt: Date;

    private _host: PlayerId;

    get host(): PlayerId {
        return this._host;
    }

    private _updatedAt: Date;

    get updatedAt(): Date {
        return this._updatedAt;
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
        instance.apply(new GameSessionCreatedDomainEvent(instance.id.value, instance._host.value));
        return instance;
    }

    addPlayer(player: Player) {
        const team = this.findTeamWithFewestPlayers();
        team.addPlayer(player);
        this.apply(new GameSessionPlayerJoinedEvent(this.id.value, player.id.value, player.name.value));
        this._updatedAt = new Date();
    }

    totalPlayerCount() {
        return this.teams.reduce((acc, team) => acc + team.players.length, 0);
    }

    removePlayer(playerId: PlayerId): boolean {
        return this.teams.some(team => {
            return team.removePlayer(playerId)
        });
    }

    isPlayerInSession(playerId: PlayerId): boolean {
        return this.teams.some(team => team.isPlayerInTeam(playerId));
    }

    hostPlayerName() {
        return this.teams.find(team => team.players.some(player => player.id.equals(this._host)))?.players.find(player => player.id.equals(this._host))?.name;
    }

    leave(playerId: PlayerId) {
        const isPlayerRemoved = this.removePlayer(playerId);
        if (!isPlayerRemoved) {
            return;
        }
        this.apply(new GameSessionPlayerLeftEvent(this.id.value, playerId.value));
        this._updatedAt = new Date();
    }

    removeIdlePlayers() {

        const removedPlayers = [];

        for (let i = 0; i < this.teams.length; i++) {
            const team = this.teams[i];
            const removedPlayersFromTeam = team.removeIdlePlayers();
            removedPlayers.push(...removedPlayersFromTeam);
        }

        if (removedPlayers.length === 0) {
            return;
        }

        if (removedPlayers.findIndex(player => player.id.equals(this._host)) !== -1 && this.totalPlayerCount() > 0) {
            const newHost = this.teams.reduce((acc: PlayerId | undefined, team) => {
                if (!acc || team.players.length > 0) {
                    return team.players[0].id;
                }
                return acc;
            }, undefined);
            if (newHost) {
                this._host = newHost;
                this.apply(new GameSessionHostChangedEvent(this.id.value, newHost.value));
            }
        }

        this.rebalanceTeams();

        removedPlayers.forEach(player => {
            this.apply(new GameSessionPlayerLeftEvent(this.id.value, player.id.value));
        });


        if (this.totalPlayerCount() === 0) {
            this.apply(new GameSessionEmptiedEvent(this.id.value));
        }
        this._updatedAt = new Date();
    }

    registerPlayerContact(playerId: PlayerId) {
        const isPlayerRegistered = this.teams.some(team => {
            return team.registerPlayerContact(playerId);
        });
        if (!isPlayerRegistered) {
            return;
        }

        this.apply(new GameSessionPlayerContactRegisteredEvent(this.id.value, playerId.value));
        this._updatedAt = new Date();
    }

    private findTeamWithFewestPlayers() {
        return this.teams.reduce((acc, team) => {
            if (!acc || team.players.length < acc.players.length) {
                return team;
            }
            return acc;
        });
    }

    private rebalanceTeams() {
        const sortedTeams = this.teams.sort((a, b) => a.players.length - b.players.length);
        const playerCountDifference = sortedTeams[1].players.length - sortedTeams[0].players.length;

        if (playerCountDifference <= 1) {
            return;
        }

        const playersToMove = Math.floor(playerCountDifference / 2);

        for (let i = 0; i < playersToMove; i++) {
            const playerToMove = sortedTeams[1].players.pop();
            sortedTeams[0].players.push(playerToMove);
        }
    }
}
