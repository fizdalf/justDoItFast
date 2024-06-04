import {TeamId} from '../valueObjects/TeamId';
import {UserId} from '../valueObjects/UserId';
import {User} from './User';

export interface TeamProps {
    id: TeamId;
    members: User[];
}

export class Team {
    protected readonly _id: TeamId;
    protected _members: User[];

    constructor({id, members}: TeamProps) {
        this._id = id;
        this._members = members;
    }

    get memberCount(): number {
        return this._members.length;
    }

    get id(): TeamId {
        return this._id;
    }

    addMember(player: User): void {
        this._members.push(player);
    };

    removeMember(playerId: UserId): void {
        this._members = this._members.filter(player => !player.id.equals(playerId));
    }

    isMember(playerId: UserId): boolean {
        return this._members.some(player => player.id.equals(playerId));
    }

    getMember(playerId: UserId) {
        return this._members.find(player => player.id.equals(playerId));
    }

    removeExtraMembers(idealNumberOfPlayers: number) {
        return this._members.splice(idealNumberOfPlayers);
    }
}
