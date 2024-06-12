import {RoomId} from '../value-objects/RoomId';
import {Command} from '../../../shared/domain/command';
import {UserId} from "../value-objects/UserId";
import {UserName} from "../value-objects/UserName";

export interface CreateRoomParams {
    roomId: RoomId;
    userId: UserId,
    userName: UserName
}

export class CreateRoom implements Command {
    public readonly roomId: RoomId;
    public readonly userId: UserId;
    public readonly userName: UserName;

    constructor({roomId, userId, userName}: CreateRoomParams) {
        this.roomId = roomId;
        this.userId = userId;
        this.userName = userName;
    }
}
