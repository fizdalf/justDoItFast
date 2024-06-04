import {RoomId} from '../valueObjects/RoomId';
import {Command} from '../../../shared/domain/command';
import {UserId} from "../valueObjects/UserId";
import {UserName} from "../valueObjects/UserName";

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
