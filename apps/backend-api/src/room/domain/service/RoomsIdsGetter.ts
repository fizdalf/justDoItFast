import {RoomId} from '../valueObjects/RoomId';

export const RoomsIdsGetter = Symbol('RoomsIdsGetter');

export interface RoomsIdsGetter {
    getRoomsIds(): Promise<RoomId[]>;
}
