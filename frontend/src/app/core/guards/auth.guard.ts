import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { UserRole } from '@nnaai/shared-types';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.getUserRole() === UserRole.ADMIN) {
    return true;
  }

  router.navigate(['/forbidden']);
  return false;
};

export const userGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const role = authService.getUserRole();
  if (role === UserRole.ADMIN || role === UserRole.USER) {
    return true;
  }

  router.navigate(['/forbidden']);
  return false;
};
