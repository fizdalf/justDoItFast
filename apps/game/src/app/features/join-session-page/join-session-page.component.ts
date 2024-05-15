import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ZXingScannerModule} from '@zxing/ngx-scanner';
import {SelectIconComponent} from '../select-icon-page/components/select-icon/select-icon.component';
import {Observable} from 'rxjs';
import {JoinSessionPageStore} from './join-session-page.store';
import {GameSessionService} from '../../services/game-session/gameSessionService';
import {ImpGameSessionService} from '../../services/game-session/ImpGameSessionService';

@Component({
    selector: 'org-join-session-page',
    standalone: true,
    imports: [
        CommonModule,
        ZXingScannerModule,
        SelectIconComponent,
    ],
    templateUrl: './join-session-page.component.html',
    styleUrl: './join-session-page.component.scss',
    providers: [
        JoinSessionPageStore,
        {
            provide: GameSessionService,
            useClass: ImpGameSessionService
        }
    ],

})
export class JoinSessionPageComponent {
    scanFormats: any = ['QR_CODE'];
    vm$: Observable<any> = this.store.vm$;

    constructor(private store: JoinSessionPageStore) {

    }

    setSessionId(sessionId: string) {
        this.store.loadSession(sessionId);
    }

    setSelectedIcon($event: any) {
        this.store.setSelectedIcon($event);
    }
}
