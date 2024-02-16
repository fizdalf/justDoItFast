import {Inject, Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {ActivatedRoute} from '@angular/router';
import {APP_URL} from '../../app.config';
import {filter, map, Observable, switchMap, tap} from 'rxjs';
import {isDefined} from './is.defined';
import {SessionService} from '../../services/game-session/session.service';
import {SessionId} from '../../services/game-session/SessionId';

export interface CreateSessionPageViewModel {
    joinUrl: string | undefined;
}

interface CreateSessionPageState {
    sessionId: SessionId | undefined;
    joinUrl: string | undefined;
}

@Injectable()
export class CreateSessionPageStore extends ComponentStore<CreateSessionPageState> {

    constructor(
        private readonly activatedRoute: ActivatedRoute,
        @Inject(APP_URL) private readonly appUrl: string,
        private readonly sessionService: SessionService
    ) {
        super({joinUrl: undefined, sessionId: undefined});
    }

    //// SELECTORS ////
    vm$: Observable<CreateSessionPageViewModel> = this.select((state) => {
        return {
            joinUrl: state.joinUrl,
        };
    });

    sessionId$ = this.select((state) => state.sessionId);

    //// UPDATERS ////
    private readonly setSessionId = this.updater((state, sessionId: SessionId) => {
        return {
            ...state,
            joinUrl: `${this.appUrl}/join-session/${sessionId.value}`,
            sessionId
        };
    });
    //// EFFECTS ////

    private readonly setSessionIdFromQueryParams = this.effect(() =>

        this.activatedRoute.params.pipe(
            filter((params) => params['sessionId'] !== undefined),
            map((params) => params['sessionId']),
            tap((sessionId) => this.setSessionId(new SessionId(sessionId as string)))
        ));

    private readonly onSessionUpdated = this.effect(() =>
        this.sessionId$.pipe(
            filter(isDefined),
            switchMap((sessionId) => this.sessionService.onSessionUpdated(sessionId)),
            tap(console.log)
        )
    );

}

