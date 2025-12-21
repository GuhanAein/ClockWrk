import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OAuthService } from '../../services/oauth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="oauth-loading">
      <div class="spinner"></div>
      <p>{{loadingMessage}}</p>
    </div>
  `,
  styles: [`
    .oauth-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: white;
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #617FDE;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    p {
      margin-top: 1.5rem;
      color: #666;
      font-size: 1.1rem;
      font-family: 'Outfit', sans-serif;
    }
  `]
})
export class OAuthRedirectComponent implements OnInit {
  loadingMessage = 'Completing sign in...';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private oauthService: OAuthService
  ) { }

  ngOnInit() {
    console.log('=== OAuth Redirect Component Initialized ===');
    console.log('Current URL:', window.location.href);

    this.route.queryParams.subscribe(params => {
      console.log('Query params received:', params);

      const token = params['token'];
      const refreshToken = params['refreshToken'];
      const error = params['error'];

      console.log('Token:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('Refresh Token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'null');
      console.log('Error:', error);

      if (error) {
        console.error('OAuth error detected:', error);
        this.loadingMessage = 'Authentication failed. Redirecting...';
        setTimeout(() => {
          console.log('Redirecting to login with error');
          this.oauthService.handleOAuthError(error);
        }, 1000);
      } else if (token && refreshToken) {
        console.log('Tokens received successfully, processing...');
        this.loadingMessage = 'Success! Redirecting to dashboard...';
        setTimeout(() => {
          console.log('Calling handleOAuthCallback');
          this.oauthService.handleOAuthCallback(token, refreshToken);
        }, 500);
      } else {
        console.error('Invalid OAuth response - missing tokens');
        console.log('Token present:', !!token);
        console.log('RefreshToken present:', !!refreshToken);
        this.loadingMessage = 'Invalid response. Redirecting...';
        setTimeout(() => {
          console.log('Redirecting to login - invalid response');
          this.router.navigate(['/login'], {
            queryParams: { error: 'oauth_invalid_response' }
          });
        }, 1000);
      }
    });
  }
}
