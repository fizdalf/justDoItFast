import {ICommand} from '@nestjs/cqrs';

export class RegisterPlayerContactCommand implements ICommand {
    constructor(public readonly playerId: string, public readonly sessionId: string) {
    }

}
