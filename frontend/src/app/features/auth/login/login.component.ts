import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { LoginDto } from '@nnaai/shared-types';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  // Локальные сигналы
  showPassword = signal(false);

  // Реактивные формы (можно заменить на сигнальные формы в Angular 19)
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Вычисляемый сигнал для валидации формы
  isFormValid = this.loginForm.valid;

  get isLoading() {
    return this.authService.isLoading;
  }

  get error() {
    return this.authService.error;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const credentials = this.loginForm.value as LoginDto;
      this.authService.login(credentials).subscribe();
    }
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }
}