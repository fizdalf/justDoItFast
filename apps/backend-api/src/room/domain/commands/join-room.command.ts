import {ICommand} from '@nestjs/cqrs';
import {RoomId} from "../valueObjects/RoomId";
import {UserId} from "../valueObjects/UserId";
import {UserName} from "../valueObjects/UserName";

export class JoinRoomCommand implements ICommand {
    constructor(
        public readonly roomId: RoomId,
        public readonly userId: UserId,
        public readonly userName: UserName
    ) {
    }
}
