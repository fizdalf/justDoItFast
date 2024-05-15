export interface Player {
    id: string;
    name: string;
}

export interface Team {
    id: string;
    players: Player[];
}

export interface GameSession {
    id: string;
    teams: Team[];
    host: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface GameSessionPreview {
    id: string;
    hostName: string;
    teams: {
        players: {
            name: string;
        }[]
    }[];
}
