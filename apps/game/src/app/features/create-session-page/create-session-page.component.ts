import {ChangeDetectionStrategy, Component, NgZone, OnInit, TrackByFunction} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {QrcodeComponent} from 'qrcode-angular';
import {CreateSessionPageStore, CreateSessionPageViewModel} from './create-session-page.store';
import {Observable, OperatorFunction} from 'rxjs';

import {ImpGameSessionService} from '../../services/game-session/ImpGameSessionService';
import {GameSessionService} from '../../services/game-session/gameSessionService';
import {Player} from '../../services/game-session/gameSession';
import {HttpClientModule} from '@angular/common/http';
import {WebsocketService} from '../../services/websocket/websocket.service';


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
        HttpClientModule,
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

    constructor(private readonly store: CreateSessionPageStore, private ngZone: NgZone) {
        this.vm$ = this.store.vm$.pipe(runInZone(ngZone),);
    }

    ngOnInit(): void {
        this.store.fetchSession();
    }
}
