import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ZXingScannerModule} from '@zxing/ngx-scanner';
import {SelectIconComponent} from '../select-icon-page/components/select-icon/select-icon.component';
import {JoinSessionPageStore} from './join-session-page.store';
import {GameSessionService} from '../../services/game-session/gameSessionService';
import {ImpGameSessionService} from '../../services/game-session/ImpGameSessionService';
import {HttpClientModule} from '@angular/common/http';
import {WebsocketService} from '../../services/websocket/websocket.service';

@Component({
    selector: 'org-join-session-page',
    standalone: true,
    imports: [
        CommonModule,
        ZXingScannerModule,
        SelectIconComponent,
        HttpClientModule,
    ],
    templateUrl: './join-session-page.component.html',
    styleUrl: './join-session-page.component.scss',
    providers: [
        JoinSessionPageStore,
        WebsocketService,
        {
            provide: GameSessionService,
            useClass: ImpGameSessionService
        }
    ],

})
export class JoinSessionPageComponent {
    scanFormats: any = ['QR_CODE'];
    vm$ = this.store.vm$;

    constructor(private store: JoinSessionPageStore) {

    }

    setSessionId(sessionId: string) {
        this.store.loadSession(sessionId);
    }

    setSelectedIcon($event: any) {
        // this.store.setSelectedIcon($event);
    }

    joinSession() {

    }
}
