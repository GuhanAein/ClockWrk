import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private TOKEN_KEY = 'auth_token';

  constructor(private http: HttpClient, private router: Router) { }

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data).pipe(
      tap((res: any) => {
        if (res && res.accessToken) {
          this.setToken(res.accessToken);
        }
      })
    );
  }

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/authenticate`, data).pipe(
      tap((res: any) => {
        if (res && res.accessToken) {
          this.setToken(res.accessToken);
        }
      })
    );
  }

  sendOtp(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/otp/send`, null, { params: { email } });
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    const params = { email, otp };
    return this.http.post(`${this.apiUrl}/otp/verify`, null, { params }).pipe(
      tap((res: any) => {
        if (res && res.accessToken) {
          this.setToken(res.accessToken);
        }
      })
    );
  }

  verifySignupEmail(email: string, otp: string): Observable<any> {
    const params = { email, otp };
    return this.http.post(`${this.apiUrl}/verify-email`, null, { params }).pipe(
      tap((res: any) => {
        if (res && res.accessToken) {
          this.setToken(res.accessToken);
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.router.navigate(['/login']);
  }

  private setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Profile Management
  getProfile(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/users/me`);
  }

  updateProfile(data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/profile`, data);
  }

  changePassword(data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/password`, data);
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(`${environment.apiUrl}/upload`, formData);
  }
}
