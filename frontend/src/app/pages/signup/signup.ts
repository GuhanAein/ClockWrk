import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { OAuthService } from '../../services/oauth';
import { NotificationService } from '../../services/notification';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, CommonModule, NavbarComponent],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent {
  signupForm: FormGroup;
  otpForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';

  // States
  showOtpInput = false;
  isOtpSent = false;
  emailForOtp = '';
  showPassword = false;
  isVerifyingEmail = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private oauthService: OAuthService,
    private notification: NotificationService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    this.otpForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  get f() { return this.signupForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    if (this.signupForm.invalid) return;

    this.loading = true;
    const { name, email, password } = this.signupForm.value;

    this.authService.register({ name, email, password }).subscribe({
      next: (res) => {
        this.loading = false;
        
        if (res.requiresVerification || !res.accessToken) {
          // Registration successful, now show OTP verification
          this.isVerifyingEmail = true;
          this.emailForOtp = email;
          this.notification.success('Account created! Please verify your email.', 'Check your inbox');
        } else {
          this.notification.success('Welcome to ClockWrk!', 'Account Created');
          this.router.navigate(['/app']);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
        this.notification.error(this.errorMessage);
        this.loading = false;
      }
    });
  }

  verifySignupEmail() {
    const otp = this.otpForm.get('otp')?.value;
    if (!otp) {
      this.notification.warning('Please enter the verification code');
      return;
    }

    this.loading = true;
    this.authService.verifySignupEmail(this.emailForOtp, otp).subscribe({
      next: (res) => {
        this.loading = false;
        this.notification.success('Email verified! Welcome to ClockWrk!', 'Success');
        this.router.navigate(['/app']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid verification code';
        this.notification.error(this.errorMessage);
        this.loading = false;
      }
    });
  }

  // OTP Logic (passwordless signup)
  toggleOtpMode() {
    this.showOtpInput = !this.showOtpInput;
    this.errorMessage = '';
    this.isOtpSent = false;
    this.isVerifyingEmail = false;
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
        this.notification.success('Welcome to ClockWrk!', 'Login Successful');
        this.router.navigate(['/app']);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Invalid OTP';
        this.notification.error(this.errorMessage);
        this.loading = false;
      }
    });
  }

  signupWithGoogle() {
    this.oauthService.loginWithGoogle();
  }

  signupWithGitHub() {
    this.oauthService.loginWithGitHub();
  }
}
