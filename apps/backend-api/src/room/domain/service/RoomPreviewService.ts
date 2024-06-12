import {RoomPreviewDto} from "@org/core/room/dto/room-preview.dto";
import {RoomId} from "../value-objects/RoomId";

export const RoomPreviewService = Symbol('RoomPreviewService');

export interface RoomPreviewService {
    getRoomPreview(id: RoomId): Promise<RoomPreviewDto>;
}
