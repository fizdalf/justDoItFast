import {RoomId} from '../value-objects/RoomId';

export const RoomsIdsGetter = Symbol('RoomsIdsGetter');

export interface RoomsIdsGetter {
    getRoomsIds(): Promise<RoomId[]>;
}
