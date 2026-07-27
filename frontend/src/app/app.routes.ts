import { Routes } from '@angular/router';
// import { authGuard } from '@core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/lists',
    pathMatch: 'full'
  },
  // {
  //   path: 'auth',
  //   loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  // },
  // {
  //   path: 'lists',
  //   loadChildren: () => import('./features/lists/lists.routes').then(m => m.LISTS_ROUTES),
  //   canActivate: [authGuard]
  // },
  // {
  //   path: '**',
  //   loadComponent: () => import('./shared/components/not-found/not-found.component')
  //     .then(m => m.NotFoundComponent)
  // }
];