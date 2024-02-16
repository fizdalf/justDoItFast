import {Injectable} from '@angular/core';
import {ComponentStore} from '@ngrx/component-store';
import {SessionService} from '../../services/game-session/session.service';
import {ActivatedRoute} from '@angular/router';
import {SessionId} from '../../services/game-session/SessionId';
import {map, switchMap, tap} from 'rxjs';


interface JoinSessionPageState {
}

@Injectable()
export class JoinSessionPageStore extends ComponentStore<JoinSessionPageState> {
    constructor(private activatedRoute: ActivatedRoute, private sessionService: SessionService) {
        super({});
    }

    //// Selectors ////

    //// Updaters ////

    //// Effects ////
    private readonly setSessionIdFromRoute = this.effect(() => this.activatedRoute.params.pipe(
        map(params => params['sessionId']),
        switchMap(sessionId => this.sessionService.retrieveSession(new SessionId(sessionId))),
        tap(session => this.setSession(session))
    ));
}
