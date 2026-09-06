import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const loginGuard: CanMatchFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Keeps authenticated users inside the portal instead of showing login again.
  return authService.isAuthenticated() ? router.createUrlTree(['/dashboard']) : true;
};
