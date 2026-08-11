import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth/auth.service';
import { TicketService } from '@core/services/ticket.service';
import { UsersService } from '@core/services/users.service';
import { ITicketCreate, IUserResponse, TicketPriority } from '@nnaai/shared-types';
import { PRIORITY_OPTIONS } from '@shared/constants/ticket.constants';
import { PriorityLabelPipe } from '@shared/pipes/ticket-label.pipe';

@Component({
  selector: 'app-ticket-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    PriorityLabelPipe,
  ],
  templateUrl: './ticket-form.component.html',
  styleUrls: ['./ticket-form.component.scss'],
})
export class TicketFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly priorityOptions = PRIORITY_OPTIONS;
  readonly isStaff = this.authService.isStaff;

  users = signal<IUserResponse[]>([]);
  submitting = signal(false);
  error = signal<string | null>(null);

  form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    priority: [TicketPriority.MEDIUM],
    assigneeId: [null as number | null],
  });

  constructor() {
    effect(() => {
      if (!this.isStaff() || this.users().length > 0) {
        return;
      }
      this.usersService.getUsers().subscribe((users) => this.users.set(users));
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.submitting.set(true);
    this.error.set(null);

    const value = this.form.value;
    const dto: ITicketCreate = {
      title: value.title!.trim(),
      description: value.description!.trim(),
    };

    if (this.isStaff()) {
      dto.priority = value.priority ?? undefined;
      dto.assigneeId = value.assigneeId ?? undefined;
    }

    this.ticketService.createTicket(dto).subscribe({
      next: (ticket) => this.router.navigate(['/tickets', ticket.id]),
      error: (err) => {
        this.submitting.set(false);
        const message = err.error?.message;
        this.error.set(
          Array.isArray(message) ? message.join(', ') : message ?? 'Ошибка создания',
        );
      },
    });
  }
}
