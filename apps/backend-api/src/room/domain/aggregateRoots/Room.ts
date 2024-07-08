import {RoomId} from '../value-objects/RoomId';
import {UserId} from '../value-objects/UserId';
import {User} from '../entities/User';
import {AggregateRoot} from '@nestjs/cqrs';
import {RoomCreatedEvent} from '../events/room-created.event';
import {RoomUserJoinedEvent} from '../events/room-user-joined.event';
import {RoomUserLeftEvent} from '../events/room-user-left.event';
import {RoomEmptiedEvent} from '../events/room-emptied.event';
import {RoomUserContactRegisteredEvent} from '../events/room-user-contact-registered.event';
import {RoomHostChangedEvent} from '../events/room-host-changed.event';
import {Users} from "../entities/Users";
import {UserName} from "../value-objects/UserName";
import {UserLastContactedAt} from "../value-objects/userLastContactedAt";


export interface RoomParams {
    id: RoomId;
    host: UserId;
    createdAt: Date;
    users: User[];
}

export class OnlyHostCanCreateGameException implements Error {
    message: string;
    name: string;
}


const idleThresholdMilliseconds = 1000 * 60 * 2;

export class Room extends AggregateRoot {

    private readonly _createdAt: Date;

    private _host: UserId;
    private readonly _id: RoomId;

    get host(): UserId {
        return this._host;
    }

    constructor({id, host, createdAt, users}: RoomParams) {
        super();
        this._id = id;
        this._host = host;
        this._createdAt = createdAt;
        this._users = new Users(users);


    }

    get id(): RoomId {
        return this._id;
    }

    protected _users: Users;

    get users(): User[] {
        return this._users.toArray();
    }

    static create(sessionId: RoomId, userId: UserId, userName: UserName, date: Date): Room {

        const host = new User({
            id: userId,
            name: userName,
            lastContactedAt: UserLastContactedAt.create(date)
        });


        const instance = new Room(
            {
                id: sessionId,
                host: host.id,
                createdAt: date,
                users: [host]
            }
        );
        const roomCreatedEvent = new RoomCreatedEvent({
            aggregateId: sessionId.value,
            hostId: userId.value,
            hostName: userName.value,
            occurredOn: date
        });
        instance.apply(roomCreatedEvent);
        return instance;
    }

    addUser(userId: UserId, userName: UserName, date: Date) {

        const user = new User({
            id: userId,
            name: userName,
            lastContactedAt: UserLastContactedAt.create(date)
        });

        this._users.addUser(user);
        this.apply(new RoomUserJoinedEvent({
            aggregateId: this._id.value,
            userId: userId.value,
            userName: userName.value,
            occurredOn: date
        }));
    }

    leave(userId: UserId) {

        const isUserRemoved = this._users.remove(userId);
        if (!isUserRemoved) {
            return;
        }

        this.apply(new RoomUserLeftEvent(this._id.value, userId.value));
        if (this._users.size === 0) {
            this.apply(new RoomEmptiedEvent(this._id.value));
            return;
        }

        if (userId.equals(this._host)) {
            const newHost = this._users.first();
            this._host = newHost.id;
            this.apply(new RoomHostChangedEvent({aggregateId: this._id.value, newHostId: newHost.id.value}));
        }
    }

    removeIdleUsers(currentDateTime: Date) {

        const idleUsers: User[] = this._users.filter(user => user.isIdle(idleThresholdMilliseconds, currentDateTime));

        if (idleUsers.length === 0) {
            return;
        }

        idleUsers.forEach(idleUser => {
            this.leave(idleUser.id);
        });
    }

    registerUserContact(id: UserId, lastContactedAt: Date) {

        const user = this._users.findUserById(id);
        if (!user) {
            return;
        }
        user.registerContact(lastContactedAt);

        this.apply(new RoomUserContactRegisteredEvent(
                this._id.value,
                id.value,
                lastContactedAt.toISOString()
            )
        );
    }

    private isHost(creator: UserId) {
        return this._host.equals(creator);
    }

    createGame(creator: UserId, gameCreator: (users: User[]) => void) {
        if (!this.isHost(creator)) {
            throw new OnlyHostCanCreateGameException();
        }
        gameCreator(this._users.toArray());
    }
}
