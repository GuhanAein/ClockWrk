import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing';
import { LoginComponent } from './pages/login/login';
import { SignupComponent } from './pages/signup/signup';
import { DashboardComponent } from './pages/dashboard/dashboard';
import { HabitsComponent } from './pages/habits/habits';
import { OAuthRedirectComponent } from './pages/oauth-redirect/oauth-redirect';
import { authGuard } from './guards/auth.guard';

import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
    { path: 'signup', component: SignupComponent, canActivate: [guestGuard] },
    { path: 'app', component: DashboardComponent, canActivate: [authGuard] }, 
    { path: 'habits', component: HabitsComponent, canActivate: [authGuard] },
    { path: 'privacy', loadComponent: () => import('./pages/privacy/privacy').then(m => m.PrivacyComponent) },
    { path: 'pricing', loadComponent: () => import('./pages/pricing/pricing').then(m => m.PricingComponent) },
    { path: 'download', loadComponent: () => import('./pages/download/download').then(m => m.DownloadComponent) },
    { path: 'oauth2/redirect', component: OAuthRedirectComponent },
    { path: '**', redirectTo: '' }
];
