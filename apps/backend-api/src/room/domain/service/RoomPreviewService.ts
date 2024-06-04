import {RoomPreview} from "@org/core/room/dto/roomPreview";
import {RoomId} from "../valueObjects/RoomId";

export const RoomPreviewService = Symbol('RoomPreviewService');

export interface RoomPreviewService {
    getRoomPreview(id: RoomId): Promise<RoomPreview>;
}
