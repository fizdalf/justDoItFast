import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ZXingScannerModule} from '@zxing/ngx-scanner';

import {JoinRoomPageStore} from './join-room-page.store';
import {RoomService} from '../../services/room/roomService';
import {ImpRoomService} from '../../services/room/imp-room.service';
import {WebsocketService} from '../../services/websocket/websocket.service';
import {MatDialog} from '@angular/material/dialog';
import {PlayerNameRequestDialog} from './components/player-name-request-dialog.component';
import {Router} from '@angular/router';
import {AuthenticationService} from '../../services/authentication/authentication.service';

@Component({
    selector: 'org-join-room-page',
    standalone: true,
    imports: [
        CommonModule,
        ZXingScannerModule,
    ],
    templateUrl: './join-room-page.component.html',
    styleUrl: './join-room-page.component.scss',
    providers: [
        JoinRoomPageStore,
        WebsocketService,
        {
            provide: RoomService,
            useClass: ImpRoomService
        }
    ],

})
export class JoinRoomPageComponent {
    scanFormats: any = ['QR_CODE'];
    vm$ = this.store.vm$;

    constructor(
        private store: JoinRoomPageStore,
        private dialog: MatDialog,
        private sessionService: RoomService,
        private router: Router,
        private authenticationService: AuthenticationService,
    ) {

    }

    setSessionId(sessionId: string) {
        this.store.loadSession(sessionId);
    }

    joinSession(sessionId: string) {
        const dialogRef = this.dialog.open(PlayerNameRequestDialog);

        dialogRef.afterClosed().subscribe(async result => {
            if (!result) return;
            const roomToken = await this.sessionService.joinRoom(sessionId, result);
            this.authenticationService.login(roomToken);
            this.router.navigate(['/', 'create-session']);
        });
    }
}
