import {ICommand} from '@nestjs/cqrs';

export class RemoveIdlePlayersFromGameSessionCommand implements ICommand {
    constructor(public readonly gameSessionId: string) {
    }
}
