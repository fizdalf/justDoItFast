import {IQuery} from '@nestjs/cqrs';


export class GetCurrentRoomQuery implements IQuery {
    constructor(public readonly roomId: string, public readonly playerId: string) {
    }
}
