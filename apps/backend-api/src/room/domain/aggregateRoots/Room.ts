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
    updatedAt: Date;
    users: Users
}

export class OnlyHostCanStartGameException implements Error {
    message: string;
    name: string;
}


const idleThresholdMilliseconds = 1000 * 60 * 2;

export class Room extends AggregateRoot {

    protected _host: UserId;
    protected readonly _createdAt: Date;
    protected _updatedAt: Date;
    private readonly _id: RoomId;

    constructor({id, host, createdAt, updatedAt, users}: RoomParams) {
        super();
        this._id = id;
        this._host = host;
        this._createdAt = createdAt;
        this._updatedAt = updatedAt;
        this._users = users;

    }

    protected _users: Users;

    get users(): User[] {
        return this._users.toArray();
    }

    get id(): RoomId {
        return this._id;
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
                updatedAt: date,
                users: new Users([host])
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

    leave(userId: UserId, currentDateTime: Date) {

        const isUserRemoved = this._users.remove(userId);
        if (!isUserRemoved) {
            return;
        }

        this.apply(new RoomUserLeftEvent(this._id.value, userId.value, currentDateTime));
        if (this._users.size === 0) {
            this.apply(new RoomEmptiedEvent(this._id.value, currentDateTime));
        }
    }

    removeIdleUsers(currentDateTime: Date) {

        const idleUsers: User[] = this._users.filter(user => user.isIdle(idleThresholdMilliseconds, currentDateTime));

        if (idleUsers.length === 0) {
            return;
        }

        idleUsers.forEach(idleUser => {
            this.leave(idleUser.id, currentDateTime);
        });

        if (this._users.size === 0) {
            return;
        }

        if (idleUsers.findIndex(idleUser => idleUser.id.equals(this._host)) !== -1) {
            const newHost = this._users.first();

            if (newHost) {
                this._host = newHost.id;
                this.apply(new RoomHostChangedEvent({aggregateId: this._id.value, newHostId: newHost.id.value}));
            }
        }


        this._updatedAt = currentDateTime;
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
        this._updatedAt = lastContactedAt;
    }

    isHost(creator: UserId) {
        return this._host.equals(creator);
    }

    processUsers(creator: UserId, processor: (users: User[]) => void) {
        if (!this.isHost(creator)) {
            throw new OnlyHostCanStartGameException();
        }
        processor(this._users.toArray());
    }
}
