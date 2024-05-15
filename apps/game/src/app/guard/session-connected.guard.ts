import {CanActivateFn} from '@angular/router';


export function sessionConnectedGuard(): CanActivateFn {
    return async () => {
        if(!sessionStorage.getItem('gameSessionToken')){
            return false;
        }

        return true;
    };
}
