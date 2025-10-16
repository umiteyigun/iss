import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Add auth token to requests
  const authHeaders = authService.getAuthHeaders();
  
  const authReq = req.clone({
    setHeaders: authHeaders
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Token expired or invalid - logout and redirect
        authService.logout();
        // Force navigation to login page
        window.location.href = '/login';
      }
      return throwError(() => error);
    })
  );
};
