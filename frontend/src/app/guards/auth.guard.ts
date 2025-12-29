import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Simple check: if we have a token, allow access
    // The interceptor will handle token refresh if needed
    const token = authService.getToken();
    
    if (token) {
        // We have a token - allow access
        // If it's expired, the interceptor will refresh it or handle the error
        return true;
    }

    // No token at all - redirect to login
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
