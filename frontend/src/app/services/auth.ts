import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, BehaviorSubject, timer, Subscription } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';

export interface AuthResponse {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn?: number;
  requiresVerification?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  profilePictureUrl?: string;
  emailVerified: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private readonly ACCESS_TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  private refreshTokenSubscription: Subscription | null = null;
  private isRefreshing = false;
  
  private userSubject = new BehaviorSubject<UserProfile | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Setup token refresh on app init
    if (this.isAuthenticated()) {
      this.scheduleTokenRefresh();
    }
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((res) => {
        if (res && res.accessToken) {
          this.storeTokens(res);
        }
      })
    );
  }

  login(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/authenticate`, data).pipe(
      tap((res) => {
        if (res && res.accessToken) {
          this.storeTokens(res);
        }
      })
    );
  }

  sendOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/otp/send`, null, { params: { email } });
  }

  verifyOtp(email: string, otp: string): Observable<AuthResponse> {
    const params = { email, otp };
    return this.http.post<AuthResponse>(`${this.apiUrl}/otp/verify`, null, { params }).pipe(
      tap((res) => {
        if (res && res.accessToken) {
          this.storeTokens(res);
        }
      })
    );
  }

  verifySignupEmail(email: string, otp: string): Observable<AuthResponse> {
    const params = { email, otp };
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify-email`, null, { params }).pipe(
      tap((res) => {
        if (res && res.accessToken) {
          this.storeTokens(res);
        }
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.http.post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken }).pipe(
      tap((res) => {
        if (res && res.accessToken) {
          this.storeTokens(res);
        }
      })
    );
  }

  logout() {
    this.clearTokens();
    this.userSubject.next(null);
    this.cancelTokenRefresh();
    this.router.navigate(['/login']);
  }

  private storeTokens(response: AuthResponse) {
    if (response.accessToken) {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
    }
    if (response.refreshToken) {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    }
    if (response.expiresIn) {
      const expiryTime = Date.now() + response.expiresIn;
      localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
      this.scheduleTokenRefresh();
    }
  }

  private clearTokens() {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    // Check if token is expired
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (expiry) {
      const expiryTime = parseInt(expiry, 10);
      if (Date.now() > expiryTime) {
        // Token expired, try to refresh
        return !!this.getRefreshToken();
      }
    }

    return true;
  }

  isTokenExpired(): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;
    
    const expiryTime = parseInt(expiry, 10);
    return Date.now() > expiryTime;
  }

  private scheduleTokenRefresh() {
    this.cancelTokenRefresh();

    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return;

    const expiryTime = parseInt(expiry, 10);
    // Refresh 5 minutes before expiry
    const refreshTime = expiryTime - Date.now() - (5 * 60 * 1000);

    if (refreshTime > 0) {
      this.refreshTokenSubscription = timer(refreshTime).subscribe(() => {
        this.performTokenRefresh();
      });
    } else if (this.getRefreshToken()) {
      // Token already expired or about to, refresh immediately
      this.performTokenRefresh();
    }
  }

  private performTokenRefresh() {
    if (this.isRefreshing) return;

    this.isRefreshing = true;
    this.refreshToken().subscribe({
      next: () => {
        this.isRefreshing = false;
        console.log('Token refreshed successfully');
      },
      error: (err) => {
        this.isRefreshing = false;
        console.error('Token refresh failed', err);
        // If refresh fails, log out the user
        this.logout();
      }
    });
  }

  private cancelTokenRefresh() {
    if (this.refreshTokenSubscription) {
      this.refreshTokenSubscription.unsubscribe();
      this.refreshTokenSubscription = null;
    }
  }

  // Profile Management
  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${environment.apiUrl}/users/me`).pipe(
      tap(user => this.userSubject.next(user))
    );
  }

  updateProfile(data: any): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${environment.apiUrl}/users/profile`, data).pipe(
      tap(user => this.userSubject.next(user))
    );
  }

  changePassword(data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/password`, data);
  }

  uploadAvatar(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>(`${environment.apiUrl}/upload`, formData);
  }
}
