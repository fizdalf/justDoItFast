import {Room} from '../aggregateRoots/Room';
import {RoomId} from '../value-objects/RoomId';

export const RoomRepository = Symbol('RoomRepository');

export interface RoomRepository {
    save(room: Room): Promise<void>

    /** @throws RoomNotFoundException */
    findOneById(id: RoomId): Promise<Room>

    remove(id: RoomId): Promise<void>;
}
