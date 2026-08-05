import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, finalize } from 'rxjs';
import {
  IAuthResponse,
  ILoginRequest,
  IRegisterRequest,
  IUserResponse,
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

  getUserRole() {
    return this.currentUserSignal()?.role ?? null;
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
