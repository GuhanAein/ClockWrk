import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastr: ToastrService) {}

  success(message: string, title: string = 'Success'): void {
    this.toastr.success(message, title, {
      timeOut: 3000,
      positionClass: 'toast-top-right',
      closeButton: true,
      progressBar: true
    });
  }

  error(message: string, title: string = 'Error'): void {
    this.toastr.error(message, title, {
      timeOut: 5000,
      positionClass: 'toast-top-right',
      closeButton: true,
      progressBar: true
    });
  }

  warning(message: string, title: string = 'Warning'): void {
    this.toastr.warning(message, title, {
      timeOut: 4000,
      positionClass: 'toast-top-right',
      closeButton: true,
      progressBar: true
    });
  }

  info(message: string, title: string = 'Info'): void {
    this.toastr.info(message, title, {
      timeOut: 3000,
      positionClass: 'toast-top-right',
      closeButton: true,
      progressBar: true
    });
  }
}

