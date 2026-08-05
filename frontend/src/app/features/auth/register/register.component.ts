import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { RegisterDto } from '@nnaai/shared-types';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Регистрация</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput formControlName="email" type="email" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Имя</mat-label>
              <input matInput formControlName="firstName" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Фамилия</mat-label>
              <input matInput formControlName="lastName" />
            </mat-form-field>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Пароль</mat-label>
              <input matInput formControlName="password" type="password" />
            </mat-form-field>
            @if (error()) {
              <div class="error-message">{{ error() }}</div>
            }
            <button
              mat-raised-button
              color="primary"
              class="full-width"
              type="submit"
              [disabled]="registerForm.invalid || isLoading()"
            >
              @if (isLoading()) {
                <mat-spinner diameter="20" />
              } @else {
                Зарегистрироваться
              }
            </button>
          </form>
        </mat-card-content>
        <mat-card-actions>
          <p>Уже есть аккаунт? <a routerLink="/login">Войти</a></p>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: `
    .register-container {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
    .register-card {
      width: 100%;
      max-width: 420px;
    }
    .full-width {
      width: 100%;
    }
    .error-message {
      color: #c62828;
      margin-bottom: 1rem;
    }
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly isLoading = this.authService.isLoading;
  readonly error = this.authService.error;

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    const data = this.registerForm.value as RegisterDto;
    this.authService.register(data).subscribe({
      next: () => {
        this.authService.login({ email: data.email, password: data.password }).subscribe({
          next: () => this.router.navigate(['/tickets']),
        });
      },
    });
  }
}
