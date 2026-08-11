import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TicketService } from '@core/services/ticket.service';
import { UsersService } from '@core/services/users.service';
import {
  ITicket,
  ITicketQuery,
  IUserResponse,
  TicketPriority,
  TicketStatus,
} from '@nnaai/shared-types';
import { PriorityLabelPipe, StatusLabelPipe } from '@shared/pipes/ticket-label.pipe';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '@shared/constants/ticket.constants';

const PAGE_SIZE = 10;

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    PriorityLabelPipe,
    StatusLabelPipe,
  ],
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss'],
})
export class TicketListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly ticketService = inject(TicketService);
  private readonly usersService = inject(UsersService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadMoreSentinel = viewChild<ElementRef<HTMLElement>>('loadMoreSentinel');
  private observer: IntersectionObserver | null = null;

  readonly displayedColumns = [
    'id',
    'title',
    'priority',
    'status',
    'author',
    'assignee',
    'createdAt',
  ];
  readonly priorityOptions = PRIORITY_OPTIONS;
  readonly statusOptions = STATUS_OPTIONS;

  tickets = signal<ITicket[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(false);
  loadingMore = signal(false);
  users = signal<IUserResponse[]>([]);

  readonly hasMore = computed(() => this.tickets().length < this.total());

  filtersForm = this.fb.group({
    search: [''],
    status: ['' as TicketStatus | ''],
    priority: ['' as TicketPriority | ''],
    assigneeId: ['' as number | ''],
    sortBy: ['createdAt' as ITicketQuery['sortBy']],
    sortOrder: ['DESC' as ITicketQuery['sortOrder']],
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.observer?.disconnect());

    afterRenderEffect(() => {
      const el = this.loadMoreSentinel()?.nativeElement;
      this.observer?.disconnect();
      this.observer = null;

      if (!el) return;

      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) {
            this.loadMore();
          }
        },
        { root: null, rootMargin: '200px', threshold: 0 },
      );
      this.observer.observe(el);
    });
  }

  ngOnInit(): void {
    this.usersService.getUsers().subscribe((users) => this.users.set(users));

    this.route.queryParams.subscribe((params) => {
      this.filtersForm.patchValue(
        {
          search: params['search'] ?? '',
          status: params['status'] ?? '',
          priority: params['priority'] ?? '',
          assigneeId: params['assigneeId'] ? Number(params['assigneeId']) : '',
          sortBy: params['sortBy'] ?? 'createdAt',
          sortOrder: params['sortOrder'] ?? 'DESC',
        },
        { emitEvent: false },
      );
      this.loadTickets(true);
    });

    this.filtersForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => this.applyFilters());
  }

  applyFilters(): void {
    this.updateQueryParams();
  }

  openTicket(id: number): void {
    this.router.navigate(['/tickets', id]);
  }

  userName(user: IUserResponse | null | undefined): string {
    if (!user) return '—';
    return `${user.firstName} ${user.lastName}`;
  }

  private loadMore(): void {
    if (this.loading() || this.loadingMore() || !this.hasMore()) return;
    this.page.update((p) => p + 1);
    this.loadTickets(false);
  }

  private updateQueryParams(): void {
    const form = this.filtersForm.value;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: null,
        limit: null,
        search: form.search || null,
        status: form.status || null,
        priority: form.priority || null,
        assigneeId: form.assigneeId || null,
        sortBy: form.sortBy || null,
        sortOrder: form.sortOrder || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  private loadTickets(reset: boolean): void {
    if (reset) {
      this.page.set(1);
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    const form = this.filtersForm.value;
    const query: ITicketQuery = {
      page: this.page(),
      limit: PAGE_SIZE,
      sortBy: form.sortBy ?? 'createdAt',
      sortOrder: form.sortOrder ?? 'DESC',
      search: form.search || undefined,
      status: form.status || undefined,
      priority: form.priority || undefined,
      assigneeId: form.assigneeId ? Number(form.assigneeId) : undefined,
    };

    this.ticketService.getTickets(query).subscribe({
      next: (response) => {
        if (reset) {
          this.tickets.set(response.data);
        } else {
          this.tickets.update((prev) => [...prev, ...response.data]);
        }
        this.total.set(response.total);
        this.loading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        if (!reset) {
          this.page.update((p) => Math.max(1, p - 1));
        }
        this.loading.set(false);
        this.loadingMore.set(false);
      },
    });
  }
}
