import { TicketPriority, TicketStatus } from '@nnaai/shared-types';

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  [TicketPriority.LOW]: 'Низкий',
  [TicketPriority.MEDIUM]: 'Средний',
  [TicketPriority.HIGH]: 'Высокий',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  [TicketStatus.OPEN]: 'Открыта',
  [TicketStatus.IN_PROGRESS]: 'В работе',
  [TicketStatus.RESOLVED]: 'Решена',
  [TicketStatus.CLOSED]: 'Закрыта',
};

export const PRIORITY_OPTIONS = Object.values(TicketPriority);
export const STATUS_OPTIONS = Object.values(TicketStatus);
