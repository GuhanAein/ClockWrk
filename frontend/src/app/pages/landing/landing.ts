import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, NavbarComponent],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class LandingComponent { }
