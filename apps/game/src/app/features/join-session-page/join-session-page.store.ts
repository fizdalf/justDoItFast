import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {GameSessionService} from '../../services/game-session/gameSessionService';
import {combineLatestWith, filter, Observable, switchMap, tap} from 'rxjs';
import {IconListService} from '../../services/icon-list/icon-list.service';
import {Router} from '@angular/router';
import {isDefined} from '../create-session-page/is.defined';
import {GameSession, Team} from '../../services/game-session/gameSession';



interface JoinSessionPageState {
    sessionId: string | undefined;
    playerName: string | undefined;
    session: GameSession | undefined;
}

@Injectable()
export class JoinSessionPageStore extends ComponentStore<JoinSessionPageState> {
    constructor(
        private sessionService: GameSessionService,
        private iconListService: IconListService,
        private router: Router
    ) {
        super({
            sessionId: undefined,
            session: undefined,
            playerName: undefined,
        });
    }

    //// Selectors ////
    public readonly vm$ = this.select((state) => {
        return {
            availableIcons: [],
        };
    });

    private readonly session$ = this.select((state) => state.session)
        .pipe(filter(isDefined),);
    //// Updaters ////

    private setSession = this.updater((state, session: GameSession) => {
        const availableIcons = this.iconListService.retrieveIcons()
            .filter((icon) => !session.teams.some((team: Team) => team.players.some(p => p.name === icon.name)));
        return {
            ...state,
            session: session,
            availableIcons
        };

    })

    //// Effects ////
    public readonly loadSession = this.effect<string>((sessionId$: Observable<string>) => {
        return sessionId$.pipe(
            switchMap((sessionId) => this.sessionService.openSession()),
            tap((session) => this.setSession(session))
        );
    });

    public readonly setSelectedIcon = this.effect<any>((selectedIcon$) => {
        return selectedIcon$.pipe(
            combineLatestWith(this.session$),
            switchMap(async ([selectedIcon, session]) => {
                await this.sessionService.joinSession(session.id    , selectedIcon.name);
                this.router.navigate(['/', 'session-join-waiting-room', session.id]);
            }),
        );
    });

}
