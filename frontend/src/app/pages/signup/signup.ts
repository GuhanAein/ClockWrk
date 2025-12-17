import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, FormsModule, NavbarComponent],
  templateUrl: './signup.html',
  styleUrls: ['./signup.css']
})
export class SignupComponent {
  name = '';
  email = '';
  password = '';

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    if (!this.email || !this.password || !this.name) return;

    this.authService.register({ name: this.name, email: this.email, password: this.password }).subscribe({
      next: (res) => {
        console.log('Registration success', res);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Registration failed', err);
        alert('Registration failed');
      }
    });
  }
}
