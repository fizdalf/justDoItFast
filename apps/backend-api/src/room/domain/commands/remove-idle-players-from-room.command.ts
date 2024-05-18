import {ICommand} from '@nestjs/cqrs';

export class RemoveIdlePlayersFromRoomCommand implements ICommand {
    constructor(public readonly roomId: string) {
    }
}
