import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { OAuthService } from '../../services/oauth';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, NavbarComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  otpForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';

  // States
  showOtpInput = false;
  isOtpSent = false;
  emailForOtp = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private oauthService: OAuthService,
    private router: Router
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
        this.router.navigate(['/app']);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid email or password';
        this.loading = false;
      }
    });
  }

  // OTP Flow
  toggleOtpMode() {
    this.showOtpInput = !this.showOtpInput;
    this.errorMessage = '';
    this.isOtpSent = false;
  }

  sendOtp() {
    const email = this.otpForm.get('email')?.value;
    if (!email) {
      this.errorMessage = 'Please enter your email first';
      return;
    }

    this.loading = true;
    this.authService.sendOtp(email).subscribe({
      next: () => {
        this.isOtpSent = true;
        this.emailForOtp = email;
        this.loading = false;
        this.errorMessage = '';
        alert('OTP sent to your email!');
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to send OTP';
        this.loading = false;
      }
    });
  }

  verifyOtp() {
    const otp = this.otpForm.get('otp')?.value;
    if (!otp) return;

    this.loading = true;
    this.authService.verifyOtp(this.emailForOtp, otp).subscribe({
      next: (res) => {
        this.router.navigate(['/app']);
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid OTP';
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
