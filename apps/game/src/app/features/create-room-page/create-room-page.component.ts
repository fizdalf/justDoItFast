import {Component, DestroyRef, Inject, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Observable, of, tap} from 'rxjs';

import {Router} from '@angular/router';

import {RoomService} from '../../services/room/roomService';
import {MatInputModule} from '@angular/material/input';
import {ImpRoomService} from '../../services/room/imp-room.service';

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
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule,
    ],
    templateUrl: './create-room-page.component.html',
    providers: [
        {
            provide: RoomService,
            useClass: ImpRoomService
        },
        WebsocketService
    ],
    styleUrl: './create-room-page.component.scss',
})
export class CreateRoomPageComponent implements OnInit {

    constructor(
        private router: Router,
        @Inject(RoomService) private sessionService: RoomService,
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
        const roomToken = await this.sessionService.createRoom(this.playerName.value);
        sessionStorage.setItem('roomToken', roomToken);
        this.router.navigate(['/', 'create-session']);
    }
}
