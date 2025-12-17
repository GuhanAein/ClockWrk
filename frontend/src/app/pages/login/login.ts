import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, NavbarComponent],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    if (!this.email || !this.password) return;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        console.log('Login success', res);
        this.router.navigate(['/app']);
      },
      error: (err) => {
        console.error('Login failed', err);
        alert('Invalid credentials');
      }
    });
  }
}
