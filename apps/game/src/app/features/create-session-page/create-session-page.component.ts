import {ChangeDetectionStrategy, Component, NgZone, OnInit, TrackByFunction} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {QrcodeComponent} from 'qrcode-angular';
import {CreateSessionPageStore, CreateSessionPageViewModel} from './create-session-page.store';
import {Observable, OperatorFunction} from 'rxjs';

import {ImpGameSessionService} from '../../services/game-session/ImpGameSessionService';
import {GameSessionService} from '../../services/game-session/gameSessionService';
import {Player} from '../../services/game-session/gameSession';
import {WebsocketService} from '../../services/websocket/websocket.service';
import {
    MatCard,
    MatCardActions,
    MatCardContent,
    MatCardHeader,
    MatCardSubtitle,
    MatCardTitle
} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {Router, RouterLink} from '@angular/router';
import {MatButton} from '@angular/material/button';


export function runInZone<T>(zone: NgZone): OperatorFunction<T, T> {
    return (source) => {
        return new Observable(subscriber => {
            return source.subscribe({
                next: value => zone.run(() => subscriber.next(value)),
                error: error => zone.run(() => subscriber.error(error)),
                complete: () => zone.run(() => subscriber.complete())
            });
        });

    }
}

@Component({
    selector: 'org-create-session-page',
    standalone: true,
    imports: [
        CommonModule,
        QrcodeComponent,
        NgOptimizedImage,
        MatCard,
        MatCardTitle,
        MatCardContent,
        MatIcon,
        MatCardHeader,
        MatCardSubtitle,
        RouterLink,
        MatCardActions,
        MatButton,
    ],
    templateUrl: './create-session-page.component.html',
    styleUrl: './create-session-page.component.scss',
    providers: [
        CreateSessionPageStore,
        {
            provide: GameSessionService,
            useClass: ImpGameSessionService
        },
        WebsocketService
    ],
    changeDetection: ChangeDetectionStrategy.Default
})
export class CreateSessionPageComponent implements OnInit {
    vm$: Observable<CreateSessionPageViewModel>;
    trackByPlayerId: TrackByFunction<Player> = (index, player) => player.id;

    constructor(
        private readonly store: CreateSessionPageStore, ngZone: NgZone,
        private readonly router: Router
    ) {
        this.vm$ = this.store.vm$.pipe(runInZone(ngZone),);
    }

    ngOnInit(): void {
    }

    startGame() {
    }

    leaveGame() {
        this.store.leaveGame();
        this.router.navigate(['/']);
    }
}
