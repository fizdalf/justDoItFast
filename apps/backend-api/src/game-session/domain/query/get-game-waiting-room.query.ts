import {IQuery} from '@nestjs/cqrs';
import {RoomId} from "../../../room/domain/value-objects/RoomId";
import {UserId} from "../../../room/domain/value-objects/UserId";


export class GetGameWaitingRoomQuery implements IQuery {
    constructor(public readonly roomId: RoomId, public readonly userId: UserId) {
    }
}
