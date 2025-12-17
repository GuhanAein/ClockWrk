import { Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing';
import { LoginComponent } from './pages/login/login';
import { SignupComponent } from './pages/signup/signup';
import { DashboardComponent } from './pages/dashboard/dashboard';

export const routes: Routes = [
    { path: '', component: LandingComponent },
    { path: 'login', component: LoginComponent },
    { path: 'signup', component: SignupComponent },
    { path: 'app', component: DashboardComponent },
    { path: '**', redirectTo: '' }
];
