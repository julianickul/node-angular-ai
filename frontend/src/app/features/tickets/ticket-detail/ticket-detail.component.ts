import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
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

  readonly priorityOptions = PRIORITY_OPTIONS;
  readonly statusOptions = STATUS_OPTIONS;

  ticket = signal<ITicket | null>(null);
  users = signal<IUserResponse[]>([]);
  loading = signal(true);
  saving = signal(false);
  deleting = signal(false);

  editForm = this.fb.group({
    status: ['' as TicketStatus],
    priority: ['' as TicketPriority],
    assigneeId: [null as number | null],
  });

  ngOnInit(): void {
    this.usersService.getUsers().subscribe((users) => this.users.set(users));

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTicket(id);
  }

  save(): void {
    const ticket = this.ticket();
    if (!ticket) return;

    this.saving.set(true);
    const form = this.editForm.value;
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
      error: () => this.saving.set(false),
    });
  }

  deleteTicket(): void {
    const ticket = this.ticket();
    if (!ticket || !confirm('Удалить заявку?')) return;

    this.deleting.set(true);
    this.ticketService.deleteTicket(ticket.id).subscribe({
      next: () => this.router.navigate(['/tickets']),
      error: () => this.deleting.set(false),
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
        this.editForm.patchValue({
          status: ticket.status,
          priority: ticket.priority,
          assigneeId: ticket.assigneeId,
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/tickets']);
      },
    });
  }
}
