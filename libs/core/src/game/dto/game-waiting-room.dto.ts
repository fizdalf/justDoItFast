export interface GameWaitingRoomDto {
    id: string;
    roomId: string;
    isHost: boolean;
    users: { id: string, name: string }[];
    seats: { index: number, userId: string }[];
}