import {CanActivateFn} from '@angular/router';


export function sessionConnectedGuard(): CanActivateFn {
    return async () => {
        return !!sessionStorage.getItem('gameSessionToken');
    };
}
