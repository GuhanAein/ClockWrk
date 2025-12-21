import { Component } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent {

  constructor(public authService: AuthService, private router: Router) { }

  onLogoClick() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/app']);
    } else {
      this.router.navigate(['/']);
    }
  }
}
