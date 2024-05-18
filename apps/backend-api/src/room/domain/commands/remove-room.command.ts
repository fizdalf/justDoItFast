import {ICommand} from '@nestjs/cqrs';

export class RemoveRoomCommand implements ICommand {
    constructor(public readonly roomId: string) {
    }
}
