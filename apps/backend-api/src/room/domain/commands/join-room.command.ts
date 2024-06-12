import {ICommand} from '@nestjs/cqrs';
import {RoomId} from "../value-objects/RoomId";
import {UserId} from "../value-objects/UserId";
import {UserName} from "../value-objects/UserName";

export class JoinRoomCommand implements ICommand {
    constructor(
        public readonly roomId: RoomId,
        public readonly userId: UserId,
        public readonly userName: UserName
    ) {
    }
}
