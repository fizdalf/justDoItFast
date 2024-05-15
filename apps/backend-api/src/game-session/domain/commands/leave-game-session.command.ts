import {ICommand} from '@nestjs/cqrs';


export class LeaveGameSessionCommand implements ICommand {
    constructor(public readonly gameSessionId: string, public readonly playerId: string) {
    }
}
