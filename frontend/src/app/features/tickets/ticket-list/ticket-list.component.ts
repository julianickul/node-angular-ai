import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  effect,
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
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TicketService } from '@core/services/ticket.service';
import { UsersService } from '@core/services/users.service';
import { AuthService } from '@core/services/auth/auth.service';
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

type TicketScope = 'all' | 'mine';

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
    MatButtonToggleModule,
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
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly loadMoreSentinel = viewChild<ElementRef<HTMLElement>>('loadMoreSentinel');
  private observer: IntersectionObserver | null = null;
  private pendingMineReload = false;

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
  readonly isStaff = this.authService.isStaff;

  tickets = signal<ITicket[]>([]);
  total = signal(0);
  page = signal(1);
  loading = signal(false);
  loadingMore = signal(false);
  users = signal<IUserResponse[]>([]);
  scope = signal<TicketScope>('all');

  readonly hasMore = computed(() => this.tickets().length < this.total());
  readonly showAssigneeFilter = computed(
    () => this.isStaff() && this.scope() === 'all',
  );

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

    effect(() => {
      if (!this.isStaff() || this.users().length > 0) {
        return;
      }
      this.usersService.getUsers().subscribe((users) => this.users.set(users));
    });

    effect(() => {
      const userId = this.authService.currentUser()?.id;
      if (!this.pendingMineReload || userId === undefined) {
        return;
      }
      this.pendingMineReload = false;
      this.loadTickets(true);
    });

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
    this.route.queryParams.subscribe((params) => {
      const scope: TicketScope = params['mine'] === '1' ? 'mine' : 'all';
      this.scope.set(scope);

      this.filtersForm.patchValue(
        {
          search: params['search'] ?? '',
          status: params['status'] ?? '',
          priority: params['priority'] ?? '',
          assigneeId:
            scope === 'mine'
              ? ''
              : params['assigneeId']
                ? Number(params['assigneeId'])
                : '',
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

  onScopeChange(scope: TicketScope | null): void {
    if (!scope || scope === this.scope()) {
      return;
    }

    this.scope.set(scope);
    if (scope === 'mine') {
      this.filtersForm.patchValue({ assigneeId: '' }, { emitEvent: false });
    }
    this.updateQueryParams();
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
    const isMine = this.scope() === 'mine';

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: null,
        limit: null,
        mine: isMine ? '1' : null,
        search: form.search || null,
        status: form.status || null,
        priority: form.priority || null,
        assigneeId:
          !isMine && this.isStaff() ? form.assigneeId || null : null,
        sortBy: form.sortBy || null,
        sortOrder: form.sortOrder || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  private resolveAssigneeId(formAssigneeId: number | '' | null | undefined): number | undefined {
    if (this.scope() === 'mine') {
      return this.authService.currentUser()?.id;
    }

    if (this.isStaff() && formAssigneeId) {
      return Number(formAssigneeId);
    }

    return undefined;
  }

  private loadTickets(reset: boolean): void {
    if (reset) {
      this.page.set(1);
      this.loading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    const form = this.filtersForm.value;
    const assigneeId = this.resolveAssigneeId(form.assigneeId);

    if (this.scope() === 'mine' && assigneeId === undefined) {
      this.pendingMineReload = true;
      this.loading.set(false);
      this.loadingMore.set(false);
      return;
    }

    const query: ITicketQuery = {
      page: this.page(),
      limit: PAGE_SIZE,
      sortBy: form.sortBy ?? 'createdAt',
      sortOrder: form.sortOrder ?? 'DESC',
      search: form.search || undefined,
      status: form.status || undefined,
      priority: form.priority || undefined,
      assigneeId,
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
