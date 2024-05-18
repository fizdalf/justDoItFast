import {IQuery} from '@nestjs/cqrs';

export class GetRoomPreviewQuery implements IQuery {
    constructor(public readonly roomId: string) {
    }
}
