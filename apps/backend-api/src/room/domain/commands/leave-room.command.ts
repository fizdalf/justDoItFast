import {ICommand} from '@nestjs/cqrs';
import {RoomId} from "../value-objects/RoomId";
import {UserId} from "../value-objects/UserId";


export class LeaveRoomCommand implements ICommand {
    constructor(public readonly roomId: RoomId, public readonly playerId: UserId) {
    }
}
