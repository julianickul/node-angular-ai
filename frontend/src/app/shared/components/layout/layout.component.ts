import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary">
      <a routerLink="/tickets" class="brand">Helpdesk</a>
      <span class="spacer"></span>
      @if (authService.currentUser(); as user) {
        <span class="user-name">{{ user.firstName }} {{ user.lastName }}</span>
        <button mat-button (click)="authService.logout()">Выйти</button>
      }
    </mat-toolbar>
    <main class="content">
      <router-outlet />
    </main>
  `,
  styles: `
    .brand {
      color: inherit;
      text-decoration: none;
      font-weight: 600;
    }
    .spacer {
      flex: 1;
    }
    .user-name {
      margin-right: 1rem;
      font-size: 0.875rem;
    }
    .content {
      padding: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }
  `,
})
export class LayoutComponent {
  readonly authService = inject(AuthService);
}
