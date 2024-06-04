import {ChangeDetectionStrategy, Component, NgZone, OnInit, TrackByFunction} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {QrcodeComponent} from 'qrcode-angular';
import {CreateSessionPageViewModel, RoomPageStore, Seat} from './room-page.store';
import {Observable, OperatorFunction} from 'rxjs';

import {ImpRoomService} from '../../services/room/imp-room.service';
import {RoomService} from '../../services/room/roomService';
import {Player} from '../../services/room/room';
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

interface Identifiable {
    id: string;
}

@Component({
    selector: 'org-create-room-page',
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
    templateUrl: './room-page.component.html',
    styleUrl: './room-page.component.scss',
    providers: [
        RoomPageStore,
        {
            provide: RoomService,
            useClass: ImpRoomService
        },
    ],
    changeDetection: ChangeDetectionStrategy.Default
})
export class RoomPageComponent implements OnInit {
    vm$: Observable<CreateSessionPageViewModel>;
    trackByPlayerId: TrackByFunction<Player> = (index, player) => player.id;
    trackBySeat: TrackByFunction<Seat> = (index, item) => item.id;

    constructor(
        private readonly store: RoomPageStore, ngZone: NgZone,
        private readonly router: Router
    ) {
        this.vm$ = this.store.vm$.pipe(runInZone(ngZone),);
    }

    ngOnInit(): void {
    }

    startGame() {
    }

    leaveRoom() {
        this.store.leaveRoom();
        this.router.navigate(['/']);
    }
}
