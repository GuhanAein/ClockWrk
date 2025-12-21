import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const guestGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        // User is logged in, redirect to dashboard
        return router.createUrlTree(['/app']);
    }

    // User is not logged in, allow access to login/signup
    return true;
};
