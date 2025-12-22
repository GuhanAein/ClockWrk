import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';

@Component({
    selector: 'app-download',
    standalone: true,
    imports: [CommonModule, NavbarComponent],
    templateUrl: './download.html',
    styleUrls: ['./download.css']
})
export class DownloadComponent { }
