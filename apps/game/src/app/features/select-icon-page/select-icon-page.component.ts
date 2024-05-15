import {Component, DestroyRef, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Observable, of, tap} from 'rxjs';
import {SelectIconComponent} from './components/select-icon/select-icon.component';
import {Router} from '@angular/router';

import {GameSessionService} from '../../services/game-session/gameSessionService';
import {MatInputModule} from '@angular/material/input';
import {ImpGameSessionService} from '../../services/game-session/ImpGameSessionService';
import {HttpClientModule} from '@angular/common/http';
import {FormControl, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {WebsocketService} from '../../services/websocket/websocket.service';

export interface SelectIconPageViewModel {
    name: string | undefined;
}

@Component({
    selector: 'org-select-icon-page',
    standalone: true,
    imports: [
        CommonModule,
        SelectIconComponent,
        MatInputModule,
        HttpClientModule,
        ReactiveFormsModule,
        MatButtonModule,
    ],
    templateUrl: './select-icon-page.component.html',
    providers: [
        {
            provide: GameSessionService,
            useClass: ImpGameSessionService
        },
        WebsocketService
    ],
    styleUrl: './select-icon-page.component.scss',
})
export class SelectIconPageComponent implements OnInit {

    constructor(
        private router: Router,
        @Inject(GameSessionService) private sessionService: GameSessionService,
        @Inject(DestroyRef) private destroy$: DestroyRef,
    ) {
    }

    ngOnInit(): void {
        this.playerName.valueChanges
            .pipe(
                takeUntilDestroyed(this.destroy$),
                tap(name => this.vm$ = of({name}))
            )
            .subscribe();

    }

    vm$: Observable<SelectIconPageViewModel> = of({
        name: undefined,
    });
    playerName: FormControl = new FormControl();

    async createSession() {
        const gameSessionToken = await this.sessionService.createSession(this.playerName.value);
        sessionStorage.setItem('gameSessionToken', gameSessionToken);
        this.router.navigate(['/', 'create-session']);
    }
}
