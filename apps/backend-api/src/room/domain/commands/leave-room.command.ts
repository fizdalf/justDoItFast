import {ICommand} from '@nestjs/cqrs';
import {RoomId} from "../valueObjects/RoomId";
import {UserId} from "../valueObjects/UserId";


export class LeaveRoomCommand implements ICommand {
    constructor(public readonly roomId: RoomId, public readonly playerId: UserId) {
    }
}
