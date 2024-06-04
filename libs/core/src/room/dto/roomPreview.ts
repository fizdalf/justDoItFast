export interface RoomPreview {
    id: string;
    hostPlayerName: string;
    teams: {
        players: string[];
    }[];
}
