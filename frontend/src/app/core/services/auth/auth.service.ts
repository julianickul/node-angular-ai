import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoginDto, RegisterDto, AuthResponse } from '@demo/shared-types';
import { TokenService } from './token.service';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);

  // Сигналы для состояния
  private currentUserSignal = signal<UserDto | null>(null);
  private isLoadingSignal = signal(false);
  private errorSignal = signal<string | null>(null);

  // Вычисляемые сигналы
  currentUser = this.currentUserSignal.asReadonly();
  isLoading = this.isLoadingSignal.asReadonly();
  error = this.errorSignal.asReadonly();
  isAuthenticated = computed(() => this.currentUserSignal() !== null);

  constructor() {
    // Восстанавливаем сессию при инициализации
    this.restoreSession();
  }

  login(credentials: LoginDto) {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<AuthResponse>('/api/auth/login', credentials)
      .pipe(
        tap({
          next: (response) => {
            this.tokenService.setTokens(response.accessToken, response.refreshToken);
            this.currentUserSignal.set(response.user);
            this.isLoadingSignal.set(false);
            this.router.navigate(['/lists']);
          },
          error: (error) => {
            this.errorSignal.set(error.message || 'Login failed');
            this.isLoadingSignal.set(false);
          }
        })
      );
  }

  register(userData: RegisterDto) {
    this.isLoadingSignal.set(true);
    this.errorSignal.set(null);

    return this.http.post<AuthResponse>('/api/auth/register', userData)
      .pipe(
        tap({
          next: (response) => {
            this.tokenService.setTokens(response.accessToken, response.refreshToken);
            this.currentUserSignal.set(response.user);
            this.isLoadingSignal.set(false);
            this.router.navigate(['/lists']);
          },
          error: (error) => {
            this.errorSignal.set(error.message || 'Registration failed');
            this.isLoadingSignal.set(false);
          }
        })
      );
  }

  logout() {
    this.tokenService.clearTokens();
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  private restoreSession() {
    const token = this.tokenService.getAccessToken();
    if (token) {
      // Проверяем токен на бэке
      this.http.get<UserDto>('/api/auth/me')
        .subscribe({
          next: (user) => this.currentUserSignal.set(user),
          error: () => this.tokenService.clearTokens()
        });
    }
  }
}