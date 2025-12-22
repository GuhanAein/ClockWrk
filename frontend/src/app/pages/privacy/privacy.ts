import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
    selector: 'app-privacy',
    standalone: true,
    imports: [CommonModule, NavbarComponent],
    templateUrl: './privacy.html',
    styles: [`
    .privacy-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 4rem 2rem;
      font-family: 'Outfit', sans-serif;
      color: #333;
    }
    h1 { font-size: 2.5rem; margin-bottom: 2rem; font-weight: 700; color: #111; }
    h2 { font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #444; }
    p { line-height: 1.7; margin-bottom: 1.5rem; color: #666; }
    ul { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    li { margin-bottom: 0.5rem; color: #666; }
  `]
})
export class PrivacyComponent { }
