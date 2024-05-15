import {Component} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {SessionJoinWaitingRoomPageStore} from './session-join-waiting-room-page.store';
import {Router} from '@angular/router';

@Component({
    selector: 'org-session-join-waiting-room-page',
    standalone: true,
    imports: [CommonModule, NgOptimizedImage],
    templateUrl: './session-join-waiting-room-page.component.html',
    styleUrl: './session-join-waiting-room-page.component.scss',
    providers: [SessionJoinWaitingRoomPageStore]
})
export class SessionJoinWaitingRoomPageComponent {
    constructor(private readonly store: SessionJoinWaitingRoomPageStore, private router: Router) {

    }
    session$ = this.store.session$;

    leaveSession() {
        this.store.leaveSession();
        this.router.navigate(['/']);
    }
}
