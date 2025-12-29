import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  
  constructor(private toastr: ToastrService) {}

  success(message: string, title: string = 'Success') {
    this.toastr.success(message, title, {
      timeOut: 3000,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }

  error(message: string, title: string = 'Error') {
    this.toastr.error(message, title, {
      timeOut: 5000,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }

  warning(message: string, title: string = 'Warning') {
    this.toastr.warning(message, title, {
      timeOut: 4000,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }

  info(message: string, title: string = 'Info') {
    this.toastr.info(message, title, {
      timeOut: 3000,
      progressBar: true,
      positionClass: 'toast-top-right'
    });
  }
}

