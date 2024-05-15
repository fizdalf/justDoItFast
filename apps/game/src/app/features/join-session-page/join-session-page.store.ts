import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {GameSessionService} from '../../services/game-session/gameSessionService';
import {combineLatestWith, filter, Observable, switchMap, tap} from 'rxjs';
import {Router} from '@angular/router';
import {isDefined} from '../create-session-page/is.defined';

import {GameSessionPreview} from '@org/core/game-session/dto/gameSessionPreview';


interface JoinSessionPageState {
    sessionId: string | undefined;
    playerName: string | undefined;
    session: GameSessionPreview | undefined;
}

@Injectable()
export class JoinSessionPageStore extends ComponentStore<JoinSessionPageState> {
    constructor(
        private sessionService: GameSessionService,
        private router: Router
    ) {
        super({
            sessionId: undefined,
            session: undefined,
            playerName: undefined,
        });
    }

    //// Selectors ////
    public readonly vm$ = this.select(() => {
        return {
            availableIcons: [],
            gameSessionPreview: null,
        };
    });

    private readonly session$ = this.select((state) => state.session)
        .pipe(filter(isDefined),);
    //// Updaters ////
    public readonly setSelectedIcon = this.effect<any>((selectedIcon$) => {
        return selectedIcon$.pipe(
            combineLatestWith(this.session$),
            switchMap(async ([selectedIcon, session]) => {
                await this.sessionService.joinSession(session.id, selectedIcon.name);
                this.router.navigate(['/', 'session-join-waiting-room', session.id]);
            }),
        );
    });
    private setSession = this.updater((state, session: GameSessionPreview) => {
        return {
            ...state,
            session: session,
        };

    })
    //// Effects ////
    public readonly loadSession = this.effect<string>((sessionId$: Observable<string>) => {
        return sessionId$.pipe(
            switchMap((sessionId) => this.sessionService.getSessionPreview(sessionId)),
            tap((session) => this.setSession(session))
        );
    });

}
