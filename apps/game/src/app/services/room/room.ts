export interface Player {
    id: string;
    name: string;
}

export interface Team {
    id: string;
    players: Player[];
}

export interface Room {
    id: string;
    teams: Team[];
    host: string;
    isHost: boolean;
    createdAt: Date;
    updatedAt: Date;
}

