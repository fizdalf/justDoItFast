import {RoomId} from '../valueObjects/RoomId';
import {PlayerId} from '../valueObjects/PlayerId';
import {TeamId} from '../valueObjects/TeamId';
import {Team} from '../entities/Team';
import {Player} from '../entities/Player';
import {AggregateRoot} from '@nestjs/cqrs';
import {RoomCreatedDomainEvent} from '../events/room-created-domain.event';
import {RoomPlayerJoinedEvent} from '../events/room-player-joined.event';
import {RoomPlayerLeftEvent} from '../events/room-player-left.event';
import {RoomEmptiedEvent} from '../events/room-emptied.event';
import {RoomPlayerContactRegisteredEvent} from '../events/room-player-contact-registered.event';
import {RoomHostChangedEvent} from '../events/room-host-changed-event';

export interface RoomParams {
    id: RoomId;
    teams: Team[];
    host: PlayerId;
    createdAt: Date;
    updatedAt: Date;
}

export class Room extends AggregateRoot {
    readonly id: RoomId;
    readonly teams: Team[];
    readonly createdAt: Date;

    constructor({id, teams, host, createdAt, updatedAt}: RoomParams) {
        super();
        this.id = id;
        this.teams = teams;
        this._host = host;
        this.createdAt = createdAt;
        this._updatedAt = updatedAt;

    }

    private _host: PlayerId;

    get host(): PlayerId {
        return this._host;
    }

    private _updatedAt: Date;

    get updatedAt(): Date {
        return this._updatedAt;
    }

    static create(host: Player, sessionId: RoomId): Room {
        let redTeam = new Team(
            TeamId.random(),
            [],
        );


        redTeam.addPlayer(host)

        let blueTeam = new Team(
            TeamId.random(),
            [],
        );
        const instance = new Room(
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
        instance.apply(new RoomCreatedDomainEvent(instance.id.value, instance._host.value));
        return instance;
    }

    addPlayer(player: Player) {
        const team = this.findTeamWithFewestPlayers();
        team.addPlayer(player);
        this.apply(new RoomPlayerJoinedEvent(this.id.value, player.id.value, player.name.value, team.id.value));
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
        this.apply(new RoomPlayerLeftEvent(this.id.value, playerId.value));
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
                this.apply(new RoomHostChangedEvent(this.id.value, newHost.value));
            }
        }

        this.rebalanceTeams();

        removedPlayers.forEach(player => {
            this.apply(new RoomPlayerLeftEvent(this.id.value, player.id.value));
        });


        if (this.totalPlayerCount() === 0) {
            this.apply(new RoomEmptiedEvent(this.id.value));
        }
        this._updatedAt = new Date();
    }

    registerPlayerContact(playerId: PlayerId, lastContactedAt: Date) {
        const isPlayerRegistered = this.teams.some(team => {
            return team.registerPlayerContact(playerId);
        });
        if (!isPlayerRegistered) {
            return;
        }

        this.apply(new RoomPlayerContactRegisteredEvent(
                playerId.value,
                this.id.value,
                lastContactedAt.toISOString()
            )
        );
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
