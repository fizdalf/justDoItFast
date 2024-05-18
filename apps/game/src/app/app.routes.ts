import {Route} from '@angular/router';
import {sessionConnectedGuard} from './guard/session-connected.guard';

export const appRoutes: Route[] = [
    {
        path: '',
        loadComponent: () => import('./features/home-page/home-page.component').then((m) => m.HomePageComponent),
    },
    {
        path: 'select-icon',
        loadComponent: () => import('./features/create-room-page/create-room-page.component').then((m) => m.CreateRoomPageComponent),
    },
    {
        path: 'create-room',
        canActivate: [sessionConnectedGuard()],
        loadComponent: () => import('./features/room/room-page.component').then((m) => m.RoomPageComponent),
    },
    {
        path: 'join-room',
        loadComponent: () => import('./features/join-room-page/join-room-page.component').then((m) => m.JoinRoomPageComponent),
    },
    {
        path: '**',
        redirectTo: '',
    },
];
