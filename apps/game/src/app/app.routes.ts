import {Route} from '@angular/router';
import {sessionConnectedGuard} from './guard/session-connected.guard';
import {doesNotHaveSession} from './guard/session-not-connected.guard';

export const appRoutes: Route[] = [
    {
        path: '',
        canActivate: [doesNotHaveSession()],
        loadComponent: () => import('./features/home-page/home-page.component').then((m) => m.HomePageComponent),
    },
    {
        path: 'create-room',
        canActivate: [doesNotHaveSession()],
        loadComponent: () => import('./features/create-room-page/create-room-page.component').then((m) => m.CreateRoomPageComponent),
    },
    {
        path: 'room',
        canActivate: [sessionConnectedGuard()],
        loadComponent: () => import('./features/room/room-page.component').then((m) => m.RoomPageComponent),
    },
    {
        path: 'join-room',
        canActivate: [doesNotHaveSession()],
        loadComponent: () => import('./features/join-room-page/join-room-page.component').then((m) => m.JoinRoomPageComponent),
    },
    {
        path: 'game',
        canActivate: [sessionConnectedGuard()],
        loadComponent: () => import('./features/game-home/game-home-page.component').then((m) => m.GameHomePageComponent),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
