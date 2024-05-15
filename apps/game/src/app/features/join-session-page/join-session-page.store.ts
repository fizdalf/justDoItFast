import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {GameSessionService} from '../../services/game-session/gameSessionService';
import {Observable, switchMap, tap} from 'rxjs';
import {Router} from '@angular/router';

import {GameSessionPreview} from '@org/core/game-session/dto/gameSessionPreview';

export interface JoinSessionPageStateViewModel {
    gameSessionPreview: GameSessionPreview | null;
}

interface JoinSessionPageState {
    sessionId: string | undefined;
    playerName: string | undefined;
    gameSessionPreview: GameSessionPreview | undefined;
}

@Injectable()
export class JoinSessionPageStore extends ComponentStore<JoinSessionPageState> {
    private readonly session$ = this.select((state) => state.gameSessionPreview);

    //// Selectors ////
    public readonly vm$: Observable<{ gameSessionPreview: GameSessionPreview | undefined }> = this.select(
        this.session$,
        (session: GameSessionPreview | undefined) => {
            return {
                gameSessionPreview: session,
            };
        });
    private setSession = this.updater((state, session: GameSessionPreview) => {
        return {
            ...state,
            gameSessionPreview: session,
        };

    })
    // //// Updaters ////
    // public readonly setSelectedIcon = this.effect<any>((selectedIcon$) => {
    //     return selectedIcon$.pipe(
    //         combineLatestWith(this.session$),
    //         switchMap(async ([selectedIcon, session]) => {
    //             await this.sessionService.joinSession(session.id, selectedIcon.name);
    //             this.router.navigate(['/', 'session-join-waiting-room', session.id]);
    //         }),
    //     );
    // });

    constructor(
        private sessionService: GameSessionService,
        private router: Router
    ) {
        super({
            sessionId: undefined,
            gameSessionPreview: undefined,
            playerName: undefined,
        });
    }

    //// Effects ////
    public readonly loadSession = this.effect<string>((sessionId$: Observable<string>) => {
        return sessionId$.pipe(
            switchMap((sessionId) => this.sessionService.getSessionPreview(sessionId)),
            tap((session) => this.setSession(session))
        );
    });

}
