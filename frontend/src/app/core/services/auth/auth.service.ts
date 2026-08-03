import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { IUserResponse, UserRole } from '@nnaai/shared-types';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly user = signal<IUserResponse | null>(null);
  private readonly token = signal<string | null>(null);

  readonly currentUser = computed(() => this.user());
  readonly isAdmin = computed(() => this.user()?.role === UserRole.ADMIN);
  readonly isAuthenticated = computed(() => !!this.token());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {
    this.loadFromStorage();
  }

  async login(email: string, password: string): Promise<void> {
    const response = await this.http
      .post<{ user: IUserResponse; accessToken: string }>(
        `${environment.apiUrl}/auth/login`,
        { email, password },
      )
      .toPromise();

    if (response) {
      this.user.set(response.user);
      this.token.set(response.accessToken);
      this.saveToStorage();
    }
  }

  getUserRole(): UserRole | null {
    return this.user()?.role ?? null;
  }

  logout(): void {
    this.user.set(null);
    this.token.set(null);
    localStorage.removeItem('auth_token');
    this.router.navigate(['/login']);
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('auth_token');
    if (token) {
      this.token.set(token);
      // Здесь можно раскомментировать запрос к /auth/me
      // для получения актуальных данных пользователя
    }
  }

  private saveToStorage(): void {
    if (this.token()) {
      localStorage.setItem('auth_token', this.token()!);
    }
  }
}

// import { Injectable, inject, signal, computed } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Router } from '@angular/router';
// import { LoginDto, RegisterDto, AuthResponse, UserDto } from '@nnaai/shared-types';
// import { TokenService } from './token.service';
// import { tap } from 'rxjs/operators';
// // import { catchError, tap } from 'rxjs/operators';
// // import { of } from 'rxjs';

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   private http = inject(HttpClient);
//   private router = inject(Router);
//   private tokenService = inject(TokenService);

//   // Сигналы для состояния
//   private currentUserSignal = signal<UserDto | null>(null);
//   private isLoadingSignal = signal(false);
//   private errorSignal = signal<string | null>(null);

//   // Вычисляемые сигналы
//   currentUser = this.currentUserSignal.asReadonly();
//   isLoading = this.isLoadingSignal.asReadonly();
//   error = this.errorSignal.asReadonly();
//   isAuthenticated = computed(() => this.currentUserSignal() !== null);

//   constructor() {
//     // Восстанавливаем сессию при инициализации
//     this.restoreSession();
//   }

//   login(credentials: LoginDto) {
//     this.isLoadingSignal.set(true);
//     this.errorSignal.set(null);

//     return this.http.post<AuthResponse>('/api/auth/login', credentials)
//       .pipe(
//         tap({
//           next: (response) => {
//             this.tokenService.setTokens(response.accessToken, response.refreshToken);
//             this.currentUserSignal.set(response.user);
//             this.isLoadingSignal.set(false);
//             this.router.navigate(['/lists']);
//           },
//           error: (error) => {
//             this.errorSignal.set(error.message || 'Login failed');
//             this.isLoadingSignal.set(false);
//           }
//         })
//       );
//   }

//   register(userData: RegisterDto) {
//     this.isLoadingSignal.set(true);
//     this.errorSignal.set(null);

//     return this.http.post<AuthResponse>('/api/auth/register', userData)
//       .pipe(
//         tap({
//           next: (response) => {
//             this.tokenService.setTokens(response.accessToken, response.refreshToken);
//             this.currentUserSignal.set(response.user);
//             this.isLoadingSignal.set(false);
//             this.router.navigate(['/lists']);
//           },
//           error: (error) => {
//             this.errorSignal.set(error.message || 'Registration failed');
//             this.isLoadingSignal.set(false);
//           }
//         })
//       );
//   }

//   logout() {
//     this.tokenService.clearTokens();
//     this.currentUserSignal.set(null);
//     this.router.navigate(['/auth/login']);
//   }

//   private restoreSession() {
//     const token = this.tokenService.getAccessToken();
//     if (token) {
//       // Проверяем токен на бэке
//       this.http.get<UserDto>('/api/auth/me')
//         .subscribe({
//           next: (user) => this.currentUserSignal.set(user),
//           error: () => this.tokenService.clearTokens()
//         });
//     }
//   }
// }
