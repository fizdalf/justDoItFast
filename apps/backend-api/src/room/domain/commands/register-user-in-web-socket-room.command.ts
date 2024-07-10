import {UserId} from "../value-objects/UserId";
import {RoomId} from "../value-objects/RoomId";
import {Socket} from "socket.io";

export class RegisterUserInWebsocketCommand {
    constructor(public readonly userId: UserId, public readonly roomId: RoomId, public readonly client: Socket) {

    }
}