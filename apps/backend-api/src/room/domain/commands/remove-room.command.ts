import {ICommand} from '@nestjs/cqrs';
import {RoomId} from "../valueObjects/RoomId";

export class RemoveRoomCommand implements ICommand {
    constructor(public readonly roomId: RoomId) {
    }
}
