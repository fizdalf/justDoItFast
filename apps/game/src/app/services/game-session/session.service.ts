import {Icon} from './icon';
import {Observable} from 'rxjs';
import {SessionId} from './SessionId';
import {SessionUpdatedEvent} from './sessionUpdatedEvent';
import {PlayerId} from './player.id';
import {PlayerIcon} from './PlayerIcon';

export class TeamId {
    value: string;

    constructor(value: string) {
        this.value = value;
    }
}

export class IsHost {
    value: boolean;

    constructor(value: boolean) {
        this.value = value;
    }
}

export interface PlayerParams {
    id: PlayerId;
    icon: PlayerIcon;
    teamId: TeamId;
    isHost: IsHost;
}

export class Player {
    id: PlayerId;
    icon: PlayerIcon;
    teamId: TeamId;
    isHost: IsHost

    constructor({id, icon, teamId, isHost}: PlayerParams) {
        this.id = id;
        this.icon = icon;
        this.teamId = teamId;
        this.isHost = isHost;
    }
}

interface GameSessionParams {
    id: SessionId;
    players: Player[];
}

export class GameSession {
    id: SessionId;
    players: Player[];
    constructor({id,  players}: GameSessionParams) {
        this.id = id;
        this.players = players;
    }
}

export abstract class SessionService {
    abstract createSession(selectedIcon: Icon): Promise<SessionId>;

    abstract onSessionUpdated(sessionId: SessionId): Observable<SessionUpdatedEvent>;

    abstract retrieveSession(id: SessionId): Promise<GameSession>;
}
