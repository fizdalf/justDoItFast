import {ICommand} from '@nestjs/cqrs';
import {UserId} from "../value-objects/UserId";
import {RoomId} from "../value-objects/RoomId";

export class RegisterPlayerContactCommand implements ICommand {
    constructor(public readonly userId: UserId, public readonly roomId: RoomId) {
    }

}
