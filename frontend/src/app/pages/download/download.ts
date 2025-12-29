import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../components/navbar/navbar';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-download',
    standalone: true,
    imports: [CommonModule, NavbarComponent],
    templateUrl: './download.html',
    styleUrls: ['./download.css']
})
export class DownloadComponent {
    constructor(private toastr: ToastrService) { }

    handleDownload(platform: string) {
        this.toastr.info(`ClockWrk ${platform} build is coming soon! This is a demo link.`, 'Coming Soon');
    }
}
