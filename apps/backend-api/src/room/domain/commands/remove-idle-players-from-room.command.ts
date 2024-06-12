import {ICommand} from '@nestjs/cqrs';
import {RoomId} from "../value-objects/RoomId";

export class RemoveIdlePlayersFromRoomCommand implements ICommand {
    constructor(public readonly roomId: RoomId) {
    }
}
