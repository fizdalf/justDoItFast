import {Component} from '@angular/core';
import {RouterModule} from '@angular/router';
import {HomePageComponent} from './features/home-page/home-page.component';
import {ZXingScannerModule} from '@zxing/ngx-scanner';
import {IconListService} from './services/icon-list/icon-list.service';
import {IdentityService} from './services/identity-service/identity.service';
import {SessionStorageIdentityService} from './services/identity-service/session-storage-identity.service';
import {io} from 'socket.io-client';
import {environment} from '../environments/environment';


@Component({
    standalone: true,
    imports: [
        RouterModule,
        HomePageComponent,
        ZXingScannerModule
    ],
    selector: 'org-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    providers: [
        {
            provide: IconListService,
            useClass: IconListService
        },
        {
            provide: IdentityService,
            useClass: SessionStorageIdentityService
        }
    ]
})
export class AppComponent {
    title = 'apps/game';

    constructor() {

        const socket = io(environment.socketUrl);



        socket.on('connect', () => {
            console.log('connected');

        });

        socket.on('events', function (data) {
            console.log('event', data);
        });
        socket.on('exception', function (data) {
            console.log('event', data);
        });
        socket.on('disconnect', function () {
            console.log('Disconnected');
        });

    }
}
