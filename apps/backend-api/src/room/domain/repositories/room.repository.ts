import {Room} from '../aggregateRoots/Room';
import {RoomId} from '../valueObjects/RoomId';

export const RoomRepository = Symbol('RoomRepository');

export interface RoomRepository {
    save(room: Room): Promise<void>

    findOneById(id: RoomId): Promise<Room>

    remove(id: RoomId): Promise<void>;
}
