import {HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {catchError, Observable, throwError} from 'rxjs';
import {Injectable, Provider} from '@angular/core';
import {Router} from '@angular/router';
import {AuthenticationService} from '../services/authentication/authentication.service';

@Injectable()
export class RevokeTokenInterceptor implements HttpInterceptor {

    constructor(private router: Router, private authService: AuthenticationService) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        return next.handle(req).pipe(
            catchError((err) => {
                if (err.status === 403) {
                    this.authService.logout();
                    this.router.navigate(['/']);
                }
                return throwError(() => err);
            })
        );

    }
}

export const revokeTokenInterceptorProvider: Provider = {
    provide: HTTP_INTERCEPTORS,
    useClass: RevokeTokenInterceptor,
    multi: true
}
