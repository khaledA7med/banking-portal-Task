import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);

  if (!authService.isAuthenticated()) {
    return next(request);
  }

  // Adds a mock bearer token so requests look like authenticated API calls.
  return next(
    request.clone({
      setHeaders: {
        Authorization: 'Bearer mock-admin-session',
      },
    }),
  );
};
