import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '@core/services/auth/auth.service';
import { TicketService } from '@core/services/ticket.service';
import { UsersService } from '@core/services/users.service';
import {
  ITicket,
  ITicketUpdate,
  IUserResponse,
  TicketPriority,
  TicketStatus,
} from '@nnaai/shared-types';
import { PriorityLabelPipe, StatusLabelPipe } from '@shared/pipes/ticket-label.pipe';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@shared/constants/ticket.constants';

@Component({
  selector: 'app-ticket-detail',
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
    StatusLabelPipe,
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
})
export class TicketDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);

  readonly priorityOptions = PRIORITY_OPTIONS;
  readonly statusOptions = STATUS_OPTIONS;
  readonly isStaff = this.authService.isStaff;

  ticket = signal<ITicket | null>(null);
  users = signal<IUserResponse[]>([]);
  loading = signal(true);
  saving = signal(false);
  deleting = signal(false);
  error = signal<string | null>(null);

  readonly canDelete = computed(() => {
    const ticket = this.ticket();
    return ticket ? this.authService.canDeleteTicket(ticket) : false;
  });

  readonly canEditContent = computed(() => {
    const ticket = this.ticket();
    return ticket ? this.authService.canEditTicketContent(ticket) : false;
  });

  readonly showEditPanel = computed(
    () => this.isStaff() || this.canEditContent(),
  );

  staffForm = this.fb.group({
    status: ['' as TicketStatus],
    priority: ['' as TicketPriority],
    assigneeId: [null as number | null],
  });

  contentForm = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(255)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
  });

  constructor() {
    effect(() => {
      if (!this.isStaff() || this.users().length > 0) {
        return;
      }
      this.usersService.getUsers().subscribe((users) => this.users.set(users));
    });
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicket(id);
  }

  saveStaff(): void {
    const ticket = this.ticket();
    if (!ticket || !this.isStaff()) return;

    this.saving.set(true);
    this.error.set(null);
    const form = this.staffForm.value;
    const dto: ITicketUpdate = {
      status: form.status ?? undefined,
      priority: form.priority ?? undefined,
      assigneeId: form.assigneeId,
    };

    this.ticketService.updateTicket(ticket.id, dto).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.setError(err);
      },
    });
  }

  saveContent(): void {
    const ticket = this.ticket();
    if (!ticket || this.contentForm.invalid || !this.canEditContent()) return;

    this.saving.set(true);
    this.error.set(null);
    const form = this.contentForm.value;
    const dto: ITicketUpdate = {
      title: form.title?.trim(),
      description: form.description?.trim(),
    };

    this.ticketService.updateTicket(ticket.id, dto).subscribe({
      next: (updated) => {
        this.ticket.set(updated);
        this.contentForm.patchValue({
          title: updated.title,
          description: updated.description,
        });
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.setError(err);
      },
    });
  }

  deleteTicket(): void {
    const ticket = this.ticket();
    if (!ticket || !this.canDelete() || !confirm('Удалить заявку?')) return;

    this.deleting.set(true);
    this.ticketService.deleteTicket(ticket.id).subscribe({
      next: () => this.router.navigate(['/tickets']),
      error: (err) => {
        this.deleting.set(false);
        this.setError(err);
      },
    });
  }

  userName(user: IUserResponse | null | undefined): string {
    if (!user) return '—';
    return `${user.firstName} ${user.lastName}`;
  }

  private loadTicket(id: number): void {
    this.ticketService.getTicket(id).subscribe({
      next: (ticket) => {
        this.ticket.set(ticket);
        this.staffForm.patchValue({
          status: ticket.status,
          priority: ticket.priority,
          assigneeId: ticket.assigneeId,
        });
        this.contentForm.patchValue({
          title: ticket.title,
          description: ticket.description,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/tickets']);
      },
    });
  }

  private setError(err: { error?: { message?: string | string[] } }): void {
    const message = err.error?.message;
    this.error.set(
      Array.isArray(message) ? message.join(', ') : message ?? 'Ошибка сохранения',
    );
  }
}
