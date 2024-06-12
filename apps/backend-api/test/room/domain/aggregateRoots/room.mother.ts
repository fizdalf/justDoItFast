import {RoomId} from "../../../../src/room/domain/value-objects/RoomId";
import {Room, RoomParams} from "../../../../src/room/domain/aggregateRoots/Room";
import {UserId} from "../../../../src/room/domain/value-objects/UserId";
import {UsersMother} from "../value-objects/users.mother";

export class RoomMother {

    static create({id, host, createdAt, updatedAt, users}: Partial<RoomParams> = {}): Room {
        return new Room({
            id: id ?? RoomId.random(),
            host: host ?? UserId.random(),
            createdAt: createdAt ?? new Date(),
            updatedAt: updatedAt ?? new Date(),
            users: users ?? UsersMother.create()
        })
    }


}
