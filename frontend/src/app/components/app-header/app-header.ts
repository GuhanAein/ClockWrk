import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService, UserProfile } from '../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './app-header.html',
  styleUrls: ['./app-header.css']
})
export class AppHeaderComponent {
  @Input() username = 'User';
  @Input() userAvatarUrl = '';
  @Input() showSidebarToggle = true;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openSettings = new EventEmitter<void>();

  isProfileMenuOpen = false;
  isNavMenuOpen = false;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  toggleProfileMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
    this.isNavMenuOpen = false;
  }

  toggleNavMenu(event: MouseEvent) {
    event.stopPropagation();
    this.isNavMenuOpen = !this.isNavMenuOpen;
    this.isProfileMenuOpen = false;
  }

  closeMenus() {
    this.isProfileMenuOpen = false;
    this.isNavMenuOpen = false;
  }

  onSidebarToggle() {
    this.toggleSidebar.emit();
  }

  onOpenSettings() {
    this.isProfileMenuOpen = false;
    this.openSettings.emit();
  }

  logout() {
    this.authService.logout();
  }

  navigateTo(route: string) {
    this.isNavMenuOpen = false;
    this.router.navigate([route]);
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}

