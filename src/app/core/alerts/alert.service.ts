import { Injectable } from '@angular/core';
import Swal, { SweetAlertResult } from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  success(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      confirmButtonText: 'OK',
      icon: 'success',
      text,
      title,
    });
  }

  error(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      confirmButtonText: 'OK',
      icon: 'error',
      text,
      title,
    });
  }

  confirm(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Confirm',
      icon: 'question',
      showCancelButton: true,
      text,
      title,
    });
  }
}
