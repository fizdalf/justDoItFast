import {ICommand} from '@nestjs/cqrs';

export class RemoveSessionCommand implements ICommand {
    constructor(public readonly sessionId: string) {
    }
}
