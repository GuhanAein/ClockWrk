import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class OAuthService {
    private readonly BACKEND_URL = 'http://localhost:8080';
    private readonly GOOGLE_AUTH_URL = `${this.BACKEND_URL}/oauth2/authorization/google`;
    private readonly GITHUB_AUTH_URL = `${this.BACKEND_URL}/oauth2/authorization/github`;

    constructor(private router: Router) { }

    loginWithGoogle(): void {
        // Save current URL to redirect back after OAuth, but default to /app if on auth pages
        const currentPath = window.location.pathname;
        if (currentPath.includes('/login') || currentPath.includes('/signup') || currentPath === '/') {
            sessionStorage.setItem('oauth_redirect', '/app');
        } else {
            sessionStorage.setItem('oauth_redirect', currentPath);
        }
        // Redirect to backend OAuth endpoint
        window.location.href = this.GOOGLE_AUTH_URL;
    }

    loginWithGitHub(): void {
        const currentPath = window.location.pathname;
        if (currentPath.includes('/login') || currentPath.includes('/signup') || currentPath === '/') {
            sessionStorage.setItem('oauth_redirect', '/app');
        } else {
            sessionStorage.setItem('oauth_redirect', currentPath);
        }
        window.location.href = this.GITHUB_AUTH_URL;
    }

    handleOAuthCallback(token: string, refreshToken: string): void {
        console.log('=== handleOAuthCallback called ===');
        console.log('Token length:', token?.length);
        console.log('RefreshToken length:', refreshToken?.length);

        // Store tokens using the same key as AuthService
        localStorage.setItem('auth_token', token);
        localStorage.setItem('refreshToken', refreshToken);

        // Verify tokens are stored
        const storedToken = localStorage.getItem('auth_token');
        const storedRefreshToken = localStorage.getItem('refreshToken');

        console.log('Tokens stored successfully');
        console.log('auth_token stored:', !!storedToken, 'length:', storedToken?.length);
        console.log('refreshToken stored:', !!storedRefreshToken, 'length:', storedRefreshToken?.length);

        if (!storedToken || !storedRefreshToken) {
            console.error('ERROR: Tokens were not stored properly!');
            alert('Authentication failed - tokens not stored. Please try again.');
            this.router.navigate(['/login']);
            return;
        }

        // Get redirect URL or default to dashboard
        const redirectUrl = sessionStorage.getItem('oauth_redirect') || '/app';
        sessionStorage.removeItem('oauth_redirect');

        console.log('Redirect URL:', redirectUrl);
        console.log('Navigating to:', redirectUrl);

        // Navigate to destination
        this.router.navigate([redirectUrl]).then(success => {
            console.log('Navigation success:', success);
            console.log('Current route:', this.router.url);
            if (!success) {
                console.error('Navigation failed! Trying fallback...');
                // Try using window.location as fallback
                setTimeout(() => {
                    window.location.href = '/app';
                }, 100);
            }
        }).catch(error => {
            console.error('Navigation error:', error);
            // Force navigation using window.location
            window.location.href = '/app';
        });
    }

    handleOAuthError(error: string): void {
        console.error('OAuth error:', error);
        // Navigate to login with error message
        this.router.navigate(['/login'], {
            queryParams: { error: error }
        });
    }
}
