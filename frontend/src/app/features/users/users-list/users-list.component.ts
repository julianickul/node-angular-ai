import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth/auth.service';
import { UsersService } from '@core/services/users.service';
import { IUserResponse, UserRole } from '@nnaai/shared-types';
import { ROLE_OPTIONS } from '@shared/constants/user.constants';
import { RoleLabelPipe } from '@shared/pipes/role-label.pipe';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSelectModule,
    MatFormFieldModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    RoleLabelPipe,
  ],
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss'],
})
export class UsersListComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);

  readonly displayedColumns = ['id', 'name', 'email', 'role', 'actions'];
  readonly roleOptions = ROLE_OPTIONS;

  users = signal<IUserResponse[]>([]);
  loading = signal(true);
  savingId = signal<number | null>(null);
  deletingId = signal<number | null>(null);
  error = signal<string | null>(null);

  readonly currentUserId = () => this.authService.currentUser()?.id ?? null;

  ngOnInit(): void {
    this.loadUsers();
  }

  onRoleChange(user: IUserResponse, role: UserRole): void {
    if (user.role === role) return;

    this.savingId.set(user.id);
    this.error.set(null);

    this.usersService.updateUser(user.id, { role }).subscribe({
      next: (updated) => {
        this.users.update((list) =>
          list.map((item) => (item.id === updated.id ? updated : item)),
        );
        this.savingId.set(null);
      },
      error: (err) => {
        this.savingId.set(null);
        this.setError(err);
        this.loadUsers();
      },
    });
  }

  deleteUser(user: IUserResponse): void {
    if (user.id === this.currentUserId()) return;
    if (!confirm(`Удалить пользователя ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    this.deletingId.set(user.id);
    this.error.set(null);

    this.usersService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((item) => item.id !== user.id));
        this.deletingId.set(null);
      },
      error: (err) => {
        this.deletingId.set(null);
        this.setError(err);
      },
    });
  }

  isSelf(user: IUserResponse): boolean {
    return user.id === this.currentUserId();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.usersService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.setError(err);
      },
    });
  }

  private setError(err: { error?: { message?: string | string[] } }): void {
    const message = err.error?.message;
    this.error.set(
      Array.isArray(message) ? message.join(', ') : message ?? 'Ошибка операции',
    );
  }
}
