import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { TicketHistoryService } from '@core/services/ticket-history.service';
import { ITicketHistoryStats } from '@nnaai/shared-types';

@Component({
  selector: 'app-ticket-stats',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTableModule,
  ],
  templateUrl: './ticket-stats.component.html',
  styleUrls: ['./ticket-stats.component.scss'],
})
export class TicketStatsComponent implements OnInit {
  private readonly ticketHistoryService = inject(TicketHistoryService);

  readonly recentColumns = ['createdAt', 'ticketId', 'user', 'message'];

  stats = signal<ITicketHistoryStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly maxDayCount = computed(() => {
    const days = this.stats()?.byDay ?? [];
    return Math.max(...days.map((d) => d.count), 1);
  });

  ngOnInit(): void {
    this.ticketHistoryService.getStats(30, 25).subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        const message = err.error?.message;
        this.error.set(
          Array.isArray(message)
            ? message.join(', ')
            : message ?? 'Не удалось загрузить статистику',
        );
      },
    });
  }

  userName(firstName?: string | null, lastName?: string | null): string {
    const name = `${firstName ?? ''} ${lastName ?? ''}`.trim();
    return name || 'Система';
  }

  barHeight(count: number): string {
    return `${Math.round((count / this.maxDayCount()) * 100)}%`;
  }
}
