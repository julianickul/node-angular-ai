import { Routes } from '@angular/router';
import { authGuard, guestGuard, adminGuard, staffGuard } from '@core/guards/auth.guard';
import { LayoutComponent } from '@shared/components/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then(
        (m) => m.RegisterComponent,
      ),
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'tickets', pathMatch: 'full' },
      {
        path: 'tickets',
        loadComponent: () =>
          import('./features/tickets/ticket-list/ticket-list.component').then(
            (m) => m.TicketListComponent,
          ),
      },
      {
        path: 'tickets/new',
        loadComponent: () =>
          import('./features/tickets/ticket-form/ticket-form.component').then(
            (m) => m.TicketFormComponent,
          ),
      },
      {
        path: 'tickets/:id',
        loadComponent: () =>
          import('./features/tickets/ticket-detail/ticket-detail.component').then(
            (m) => m.TicketDetailComponent,
          ),
      },
      {
        path: 'stats',
        canActivate: [staffGuard],
        loadComponent: () =>
          import('./features/tickets/ticket-stats/ticket-stats.component').then(
            (m) => m.TicketStatsComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/users/users-list/users-list.component').then(
            (m) => m.UsersListComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(
        (m) => m.NotFoundComponent,
      ),
  },
];
