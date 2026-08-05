import { Pipe, PipeTransform } from '@angular/core';
import { TicketPriority, TicketStatus } from '@nnaai/shared-types';
import { PRIORITY_LABELS, STATUS_LABELS } from '@shared/constants/ticket.constants';

@Pipe({ name: 'priorityLabel', standalone: true })
export class PriorityLabelPipe implements PipeTransform {
  transform(value: TicketPriority | null | undefined): string {
    return value ? PRIORITY_LABELS[value] : '—';
  }
}

@Pipe({ name: 'statusLabel', standalone: true })
export class StatusLabelPipe implements PipeTransform {
  transform(value: TicketStatus | null | undefined): string {
    return value ? STATUS_LABELS[value] : '—';
  }
}
