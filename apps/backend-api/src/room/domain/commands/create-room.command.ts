import {RoomId} from '../valueObjects/RoomId';
import {Player} from '../entities/Player';
import {Command} from '../../../shared/domain/command';

export interface CreateRoomParams {
    roomId: RoomId;
    host: Player
}

export class CreateRoom implements Command {
    constructor(public readonly params: CreateRoomParams) {
    }
}
