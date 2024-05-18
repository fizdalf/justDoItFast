import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';


export function sessionConnectedGuard(): CanActivateFn {

    return async () => {
        const router = inject(Router);
        const b = !!sessionStorage.getItem('roomToken');

        if (!b) {
            await router.navigate(['/']);
        }
        return b;
    };
}
