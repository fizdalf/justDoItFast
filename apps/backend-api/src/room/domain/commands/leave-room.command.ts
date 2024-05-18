import {ICommand} from '@nestjs/cqrs';


export class LeaveRoomCommand implements ICommand {
    constructor(public readonly roomId: string, public readonly playerId: string) {
    }
}
