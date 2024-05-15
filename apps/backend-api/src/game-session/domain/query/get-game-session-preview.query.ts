import {IQuery} from '@nestjs/cqrs';

export class GetGameSessionPreviewQuery implements IQuery {
    constructor(public readonly sessionId: string) {
    }
}
