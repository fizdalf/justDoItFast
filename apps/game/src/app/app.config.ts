import {ApplicationConfig, InjectionToken} from '@angular/core';
import {provideRouter} from '@angular/router';
import {appRoutes} from './app.routes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {revokeTokenInterceptorProvider} from './http-interceptors/RevokeTokenInterceptor';
import {AuthenticationService} from './services/authentication/authentication.service';
import {WebsocketService} from './services/websocket/websocket.service';

export const APP_URL = new InjectionToken<string>('app.url');

export const appConfig: ApplicationConfig = {

    providers: [
        provideRouter(appRoutes),
        provideAnimationsAsync(),
        {
            provide: APP_URL,
            useValue: 'http://localhost:4200',
        },
        revokeTokenInterceptorProvider,
        AuthenticationService,
        WebsocketService
    ],
};
