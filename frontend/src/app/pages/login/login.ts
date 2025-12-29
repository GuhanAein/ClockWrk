import { Component, OnInit } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { OAuthService } from '../../services/oauth';
import { NotificationService } from '../../services/notification';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, NavbarComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  otpForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';

  // States
  showOtpInput = false;
  isOtpSent = false;
  emailForOtp = '';
  showPassword = false;
  requiresVerification = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private oauthService: OAuthService,
    private notification: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.otpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit() {
    // Check for OAuth error parameters
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        const message = params['message'] || 'Authentication failed';
        this.errorMessage = message;
        this.notification.error(message, 'Authentication Error');
      }
    });
  }

  // Convenience getters
  get f() { return this.loginForm.controls; }
  get o() { return this.otpForm.controls; }

  // Normal Login
  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) return;

    this.loading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login({ email, password }).subscribe({
      next: (res) => {
        this.loading = false;
        
        if (res.requiresVerification) {
          this.requiresVerification = true;
          this.emailForOtp = email;
          this.notification.info('Please verify your email to continue', 'Verification Required');
        } else if (res.accessToken) {
          this.notification.success('Welcome back!', 'Login Successful');
          this.router.navigate(['/app']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid email or password';
        this.notification.error(this.errorMessage, 'Login Failed');
        this.loading = false;
      }
    });
  }

  verifyEmail() {
    const otp = this.otpForm.get('otp')?.value;
    if (!otp) {
      this.notification.warning('Please enter the verification code');
      return;
    }

    this.loading = true;
    this.authService.verifySignupEmail(this.emailForOtp, otp).subscribe({
      next: (res) => {
        this.loading = false;
        this.notification.success('Email verified successfully!', 'Welcome');
        this.router.navigate(['/app']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid verification code';
        this.notification.error(this.errorMessage);
        this.loading = false;
      }
    });
  }

  // OTP Flow
  toggleOtpMode() {
    this.showOtpInput = !this.showOtpInput;
    this.errorMessage = '';
    this.isOtpSent = false;
    this.requiresVerification = false;
  }

  sendOtp() {
    const email = this.otpForm.get('email')?.value;
    if (!email) {
      this.notification.warning('Please enter your email first');
      return;
    }

    this.loading = true;
    this.authService.sendOtp(email).subscribe({
      next: () => {
        this.isOtpSent = true;
        this.emailForOtp = email;
        this.loading = false;
        this.errorMessage = '';
        this.notification.success('OTP sent to your email!', 'Check your inbox');
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to send OTP';
        this.notification.error(this.errorMessage);
        this.loading = false;
      }
    });
  }

  verifyOtp() {
    const otp = this.otpForm.get('otp')?.value;
    if (!otp) {
      this.notification.warning('Please enter the OTP');
      return;
    }

    this.loading = true;
    this.authService.verifyOtp(this.emailForOtp, otp).subscribe({
      next: (res) => {
        this.loading = false;
        this.notification.success('Welcome back!', 'Login Successful');
        this.router.navigate(['/app']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid OTP';
        this.notification.error(this.errorMessage);
        this.loading = false;
      }
    });
  }

  loginWithGoogle() {
    this.oauthService.loginWithGoogle();
  }

  loginWithGitHub() {
    this.oauthService.loginWithGitHub();
  }
}
