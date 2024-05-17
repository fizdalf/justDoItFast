import {Component} from '@angular/core';
import {RouterModule} from '@angular/router';
import {HomePageComponent} from './features/home-page/home-page.component';
import {ZXingScannerModule} from '@zxing/ngx-scanner';
import {HttpClientModule} from '@angular/common/http';


@Component({
    standalone: true,
    imports: [
        RouterModule,
        HomePageComponent,
        ZXingScannerModule,
        HttpClientModule
    ],
    selector: 'org-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    providers: []
})
export class AppComponent {
    title = 'apps/game';
}
