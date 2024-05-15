import {IQuery} from '@nestjs/cqrs';


export class GetCurrentSessionQuery implements IQuery {
    constructor(public readonly sessionId: string, public readonly playerId: string) {
    }
}
