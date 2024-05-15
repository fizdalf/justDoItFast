export interface GameSessionPreview {
    id: string;
    hostPlayerName: string;
    teams: {
        players: {
            name: string;
        }[]
    }[];
}
