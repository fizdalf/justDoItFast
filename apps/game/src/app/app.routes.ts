import {Route} from '@angular/router';
import {sessionConnectedGuard} from './guard/session-connected.guard';

export const appRoutes: Route[] = [
    {
        path: '',
        loadComponent: () => import('./features/home-page/home-page.component').then((m) => m.HomePageComponent),
    },
    {
        path: 'select-icon',
        loadComponent: () => import('./features/select-icon-page/select-icon-page.component').then((m) => m.SelectIconPageComponent),
    },
    {
        path: 'create-session',
        canActivate: [sessionConnectedGuard()],
        loadComponent: () => import('./features/create-session-page/create-session-page.component').then((m) => m.CreateSessionPageComponent),
    },
    {
        path: 'join-session',
        loadComponent: () => import('./features/join-session-page/join-session-page.component').then((m) => m.JoinSessionPageComponent),
    },
    {
        path: 'session-join-waiting-room/:sessionId',
        loadComponent: () => import('./features/session-join-waiting-room-page/session-join-waiting-room-page.component').then((m) => m.SessionJoinWaitingRoomPageComponent),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
