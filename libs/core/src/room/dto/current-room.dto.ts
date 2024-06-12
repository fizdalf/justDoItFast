export interface CurrentRoomDto {
    id: string;
    host: string;
    isHost: boolean;
    createdAt: Date;
    updatedAt: Date;
    users: {
        id: string;
        name: string;
    }[];
}
