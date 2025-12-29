import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from './services/auth';
import { Router } from '@angular/router';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Don't add token to auth endpoints (except refresh)
  const isAuthEndpoint = req.url.includes('/api/auth/') && !req.url.includes('/refresh-token');
  
  if (isAuthEndpoint) {
    return next(req);
  }

  const token = authService.getToken();

  if (token) {
    req = addToken(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if token expired
      if (error.status === 401) {
        const tokenExpiredHeader = error.headers?.get('X-Token-Expired');
        
        if (tokenExpiredHeader === 'true' || authService.isTokenExpired()) {
          return handleTokenRefresh(req, next, authService, router);
        }
        
        // Not a token expiry issue, redirect to login
        authService.logout();
      }
      
      return throwError(() => error);
    })
  );
};

function addToken(request: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return request.clone({
    headers: request.headers.set('Authorization', `Bearer ${token}`)
  });
}

function handleTokenRefresh(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = authService.getRefreshToken();
    
    if (!refreshToken) {
      isRefreshing = false;
      authService.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    return authService.refreshToken().pipe(
      switchMap((response) => {
        isRefreshing = false;
        
        if (response.accessToken) {
          refreshTokenSubject.next(response.accessToken);
          return next(addToken(request, response.accessToken));
        }
        
        authService.logout();
        return throwError(() => new Error('Token refresh failed'));
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  }

  // Wait for the refresh to complete
  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap((token) => next(addToken(request, token!)))
  );
}
