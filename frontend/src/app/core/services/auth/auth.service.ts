import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import {
  IAuthResponse,
  ILoginRequest,
  IRegisterRequest,
  ITicket,
  IUserResponse,
  TicketStatus,
  UserRole,
} from '@nnaai/shared-types';
import { TokenService } from './token.service';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenService = inject(TokenService);

  private readonly currentUserSignal = signal<IUserResponse | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenService.hasAccessToken());
  readonly isStaff = computed(() => {
    const role = this.currentUserSignal()?.role;
    return role === UserRole.ADMIN || role === UserRole.MODERATOR;
  });
  readonly isAdmin = computed(() => this.currentUserSignal()?.role === UserRole.ADMIN);

  constructor() {
    this.restoreSession();
  }

  login(credentials: ILoginRequest): Observable<IAuthResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<IAuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => this.handleAuthSuccess(response)),
        catchError((err) => this.handleAuthError(err)),
        finalize(() => this.isLoadingSignal.set(false)),
      );
  }

  register(userData: IRegisterRequest): Observable<IUserResponse> {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http
      .post<IUserResponse>(`${environment.apiUrl}/auth/register`, userData)
      .pipe(
        catchError((err) => this.handleAuthError(err)),
        finalize(() => this.isLoadingSignal.set(false)),
      );
  }

  logout(): void {
    const refreshToken = this.tokenService.getRefreshToken();
    if (refreshToken) {
      this.http
        .post(`${environment.apiUrl}/auth/logout`, { refreshToken })
        .subscribe({ error: () => undefined });
    }
    this.clearSession();
    this.router.navigate(['/login']);
  }

  /** Applies tokens + user after login or successful refresh */
  applySession(response: IAuthResponse): void {
    this.handleAuthSuccess(response);
  }

  /** Clears session without calling /auth/logout (used when refresh fails) */
  expireSession(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  getUserRole() {
    return this.currentUserSignal()?.role ?? null;
  }

  /** moderator/admin: status, priority, assignee */
  canManageTicketAssignment(): boolean {
    return this.isStaff();
  }

  /** user: own open ticket; staff: any */
  canEditTicketContent(ticket: ITicket): boolean {
    if (this.isStaff()) {
      return true;
    }
    const userId = this.currentUserSignal()?.id;
    return (
      userId !== undefined &&
      ticket.authorId === userId &&
      ticket.status === TicketStatus.OPEN
    );
  }

  /** user: own open ticket; staff: any */
  canDeleteTicket(ticket: ITicket): boolean {
    if (this.isStaff()) {
      return true;
    }
    const userId = this.currentUserSignal()?.id;
    return (
      userId !== undefined &&
      ticket.authorId === userId &&
      ticket.status === TicketStatus.OPEN
    );
  }

  private handleAuthSuccess(response: IAuthResponse): void {
    this.tokenService.setTokens(response.accessToken, response.refreshToken);
    this.currentUserSignal.set(response.user);
  }

  private handleAuthError(err: { error?: { message?: string | string[] } }) {
    const message = err.error?.message;
    this.errorSignal.set(
      Array.isArray(message) ? message.join(', ') : message ?? 'Ошибка авторизации',
    );
    return throwError(() => err);
  }

  private clearSession(): void {
    this.tokenService.clearTokens();
    this.currentUserSignal.set(null);
    this.errorSignal.set(null);
  }

  private restoreSession(): void {
    if (!this.tokenService.hasAccessToken()) {
      return;
    }

    this.http
      .get<IUserResponse>(`${environment.apiUrl}/auth/me`)
      .subscribe({
        next: (user) => this.currentUserSignal.set(user),
        error: () => this.clearSession(),
      });
  }
}
