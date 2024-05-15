import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {filter, Observable, switchMap, tap} from 'rxjs';
import {isDefined} from './is.defined';
import {GameSessionService} from '../../services/game-session/gameSessionService';
import {IconListService} from '../../services/icon-list/icon-list.service';
import {fromPromise} from 'rxjs/internal/observable/innerFrom';
import {GameSession, Team} from '../../services/game-session/gameSession';

export interface CreateSessionPageViewModel {
    playerCount: number;
    sessionId: string | undefined;
    teams: Team[]
}

interface CreateSessionPageState {
    session: GameSession | undefined;
    sessionId: string | undefined;
}

function totalPlayerCount(teams: Team[] | undefined): number {
    if (!teams) {
        return 0;
    }
    return teams.reduce((acc, team) => acc + team.players.length, 0);
}

@Injectable()
export class CreateSessionPageStore extends ComponentStore<CreateSessionPageState> {
    constructor(
        private readonly sessionService: GameSessionService,
    ) {
        super({sessionId: undefined, session: undefined});
    }

    //// SELECTORS ////

    private sessionId$ = this.select((state) => state.session?.id);
    private playerCount$ = this.select((state) => totalPlayerCount(state.session?.teams));

    private teams$ = this.select((state) => state.session?.teams ?? []);
    private session$ = this.select((state) => state.session);

    vm$: Observable<CreateSessionPageViewModel> = this.select(
        {
            sessionId: this.sessionId$,
            playerCount: this.playerCount$,
            teams: this.teams$,
        }, {debounce: true});

    //// UPDATERS ////
    private readonly setSession = this.updater((state, session: GameSession): CreateSessionPageState => {
        return {
            ...state,
            session,
        };
    });
    //// EFFECTS ////

    public readonly fetchSession = this.effect(() =>
        fromPromise(this.sessionService.openSession())
            .pipe(
                tap((session) => this.setSession(session)),
            )
    );
}

