import {ApplicationConfig, InjectionToken} from '@angular/core';
import {provideRouter} from '@angular/router';
import {appRoutes} from './app.routes';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';

export const APP_URL = new InjectionToken<string>('app.url');

export const appConfig: ApplicationConfig = {

    providers: [
        provideRouter(appRoutes),
        provideAnimationsAsync(),
        {
            provide: APP_URL,
            useValue: 'http://localhost:4200',
        }
    ],
};
