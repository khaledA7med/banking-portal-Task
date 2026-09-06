import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertService } from '../../../../core/alerts/alert.service';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  emailValidators,
  FocusInvalidControlDirective,
  passwordValidators,
} from '../../../../shared';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';

@Component({
  imports: [
    ButtonModule,
    FocusInvalidControlDirective,
    InputTextModule,
    PasswordModule,
    ReactiveFormsModule,
  ],
  selector: 'app-login-page',
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly alertService = inject(AlertService);
  private readonly authService = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly invalidCredentialsMessage = 'Email or password is incorrect.';
  hasInvalidCredentials = false;

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', emailValidators],
    password: ['', passwordValidators],
  });

  get emailInvalid(): boolean {
    const control = this.loginForm.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  get passwordInvalid(): boolean {
    const control = this.loginForm.controls.password;
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    this.hasInvalidCredentials = false;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (!this.authService.login(this.loginForm.getRawValue())) {
      this.hasInvalidCredentials = true;
      void this.alertService.error(
        'Login failed',
        'Use admin@portal.com and Admin@123 to access the portal.',
      );
      return;
    }

    void this.router.navigateByUrl('/dashboard');
  }
}
