export class RoomHostChangedEvent {
    constructor(
        public readonly roomId: string,
        public readonly newHostId: string,
    ) {
    }
}
