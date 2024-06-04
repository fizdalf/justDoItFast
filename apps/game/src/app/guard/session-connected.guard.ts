import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthenticationService} from '../services/authentication/authentication.service';


export function sessionConnectedGuard(): CanActivateFn {

    return async () => {
        const router = inject(Router);
        const authenticationProvider = inject(AuthenticationService);
        const b = await authenticationProvider.isAuthenticated();

        if (!b) {
            await router.navigate(['/']);
        }
        return b;
    };
}
