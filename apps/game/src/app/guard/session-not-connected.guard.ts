import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthenticationService} from '../services/authentication/authentication.service';


export function doesNotHaveSession(): CanActivateFn {
    return async () => {
        const authenticationService = inject(AuthenticationService);
        const router = inject(Router);

        const hasSession = await authenticationService.isAuthenticated();
        if (hasSession) {
            await router.navigate(['/room']);
        }
        return !hasSession;
    };
}
