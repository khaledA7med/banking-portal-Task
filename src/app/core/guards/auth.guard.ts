import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Protects every shell route and sends guests back to the login screen.
  return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
