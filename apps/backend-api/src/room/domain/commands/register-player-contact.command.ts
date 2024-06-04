import {ICommand} from '@nestjs/cqrs';
import {UserId} from "../valueObjects/UserId";
import {RoomId} from "../valueObjects/RoomId";

export class RegisterPlayerContactCommand implements ICommand {
    constructor(public readonly userId: UserId, public readonly roomId: RoomId) {
    }

}
