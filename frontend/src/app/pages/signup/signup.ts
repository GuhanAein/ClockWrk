import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { OAuthService } from '../../services/oauth';
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
  loading = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private oauthService: OAuthService,
    private router: Router
  ) {
    this.signupForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  // Convenience getter for easy access to form fields
  get f() { return this.signupForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.errorMessage = '';

    // Stop here if form is invalid
    if (this.signupForm.invalid) {
      return;
    }

    this.loading = true;
    const { name, email, password } = this.signupForm.value;

    this.authService.register({ name, email, password }).subscribe({
      next: (res) => {
        console.log('Registration success', res);
        // Navigate immediately, auth service manages token
        this.router.navigate(['/app']);
        this.loading = false;
      },
      error: (err) => {
        console.error('Registration failed', err);
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
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
