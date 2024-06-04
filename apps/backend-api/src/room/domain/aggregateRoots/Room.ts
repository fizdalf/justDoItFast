import {RoomId} from '../valueObjects/RoomId';
import {UserId} from '../valueObjects/UserId';
import {TeamId} from '../valueObjects/TeamId';
import {Team} from '../entities/Team';
import {User} from '../entities/User';
import {AggregateRoot} from '@nestjs/cqrs';
import {RoomCreatedEvent} from '../events/room-created.event';
import {RoomPlayerJoinedEvent} from '../events/room-player-joined.event';
import {RoomPlayerLeftEvent} from '../events/room-player-left.event';
import {RoomEmptiedEvent} from '../events/room-emptied.event';
import {RoomPlayerContactRegisteredEvent} from '../events/room-player-contact-registered.event';
import {RoomHostChangedEvent} from '../events/room-host-changed.event';
import {GameSession} from "./GameSession";
import {GameSessionId} from "../valueObjects/GameSessionId";
import {WordPackId} from "../valueObjects/WordPackId";
import {RoomGameSessionCreatedEvent} from "../events/room-game-session-created.event";
import {Users} from "../entities/Users";
import {Teams} from "../entities/Teams";
import {UserName} from "../valueObjects/UserName";
import {UserLastContactedAt} from "../valueObjects/userLastContactedAt";

export interface RoomParams {
    id: RoomId;
    teams: Team[];
    host: UserId;
    createdAt: Date;
    updatedAt: Date;
    gameSessionId: GameSessionId | undefined
}

class OnlyHostCanStartGameException implements Error {
    message: string;
    name: string;
}


const idleThresholdMilliseconds = 1000 * 60 * 2;

export interface RoomProps {
    id: RoomId;
    teams: Team[];
    host: UserId;
    createdAt: Date;
    updatedAt: Date;
    gameSessionId: GameSessionId | undefined
}

export class Room extends AggregateRoot {

    protected readonly _id: RoomId;
    protected readonly _teams: Teams;
    protected readonly _createdAt: Date;
    protected _updatedAt: Date;

    constructor({id, teams, host, createdAt, updatedAt, gameSessionId}: RoomParams) {
        super();
        this._id = id;
        this._teams = new Teams(...teams);
        this._host = host;
        this._createdAt = createdAt;
        this._updatedAt = updatedAt;
        this._gameSessionId = gameSessionId;

    }

    protected _gameSessionId: GameSessionId | undefined;

    get gameSessionId(): GameSessionId | undefined {
        return this._gameSessionId;
    }

    protected _host: UserId;

    get host(): UserId {
        return this._host;
    }

    protected _users: Users;

    get users(): Users {
        return this._users;
    }

    get id(): RoomId {
        return this._id;
    }

    get teams(): Team[] {
        return this._teams.toArray();
    }

    get createdAt(): Date {
        return this._createdAt;
    }

    get updatedAt(): Date {
        return this._updatedAt;
    }

    static create(sessionId: RoomId, userId: UserId, userName: UserName, date: Date): Room {
        const host = new User({
            id: userId,
            name: userName,
            lastContactedAt: UserLastContactedAt.create(date)
        });
        let redTeam = new Team(
            {id : TeamId.random(), members : []},
        );

        redTeam.addMember(host)

        let blueTeam = new Team(
            {id : TeamId.random(), members : []},
        );
        const instance = new Room(
            {
                id: sessionId,
                host: host.id,
                teams: [
                    redTeam,
                    blueTeam
                ],
                createdAt: date,
                updatedAt: date,
                gameSessionId: undefined
            }
        );
        instance.apply(new RoomCreatedEvent(instance._id.value, instance._host.value));
        return instance;
    }

    addPlayer(userId: UserId, userName: UserName, date: Date) {

        const player = new User({
            id: userId,
            name: userName,
            lastContactedAt: UserLastContactedAt.create(date)
        });
        this._users.addUser(player);
        const team = this._teams.addMember(player);

        this.apply(new RoomPlayerJoinedEvent(this._id.value, userId.value, userName.value, team.id.value));
    }

    removePlayer(playerId: UserId): boolean {
        const player = this._users.findPlayerById(playerId);
        if (!player) {
            return false;
        }
        this._teams.removePlayer(playerId);
        return true;
    }

    leave(playerId: UserId) {
        const isPlayerRemoved = this.removePlayer(playerId);
        if (!isPlayerRemoved) {
            return;
        }
        this.apply(new RoomPlayerLeftEvent(this._id.value, playerId.value));
        this._updatedAt = new Date();
    }

    removeIdlePlayers(currentDateTime: Date) {

        const idleUsers: User[] = this._users.removeIdleUsers(idleThresholdMilliseconds, currentDateTime);

        if (idleUsers.length === 0) {
            return;
        }

        const idleUserIds = idleUsers.map(user => user.id);
        this._teams.removeIdleMembersFromTeams(idleUserIds);

        if (idleUsers.findIndex(player => player.id.equals(this._host)) !== -1) {
            const newHost = this._users[0];

            if (newHost) {
                this._host = newHost.id;
                this.apply(new RoomHostChangedEvent(this._id.value, newHost.id.value));
            }
        }

        idleUsers.forEach(player => {
            this.apply(new RoomPlayerLeftEvent(this._id.value, player.id.value));
        });


        if (this._users.size === 0) {
            this.apply(new RoomEmptiedEvent(this._id.value));
        }
        this._updatedAt = new Date();
    }

    registerPlayerContact(playerId: UserId, lastContactedAt: Date) {

        const user = this._users.findPlayerById(playerId);
        if (!user) {
            return;
        }
        user.registerContact(lastContactedAt);

        this.apply(new RoomPlayerContactRegisteredEvent(
                this._id.value,
                playerId.value,
                lastContactedAt.toISOString()
            )
        );
        this._updatedAt = lastContactedAt;
    }

    startGame(creatorId: UserId, playerIds: UserId[], wordPackIds: WordPackId[], id: GameSessionId) {
        if (!this.host.equals(creatorId)) {
            throw new OnlyHostCanStartGameException();
        }

        const gameSession = GameSession.create(this._teams, playerIds, wordPackIds, id);

        this.apply(new RoomGameSessionCreatedEvent(
            this._id.value,
            id.value,
        ));

        this._gameSessionId = id;
        return gameSession;
    }
}
