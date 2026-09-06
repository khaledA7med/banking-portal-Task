import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoaderService } from '../loader/loader.service';

export const loaderInterceptor: HttpInterceptorFn = (request, next) => {
  const loaderService = inject(LoaderService);

  loaderService.show();

  // finalize runs on success and failure, so the loader cannot get stuck.
  return next(request).pipe(finalize(() => loaderService.hide()));
};
