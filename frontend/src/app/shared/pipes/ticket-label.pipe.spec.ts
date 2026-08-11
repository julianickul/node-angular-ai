import { TicketPriority, TicketStatus } from '@nnaai/shared-types';
import { PriorityLabelPipe, StatusLabelPipe } from './ticket-label.pipe';

describe('PriorityLabelPipe', () => {
  const pipe = new PriorityLabelPipe();

  it('maps priority to label', () => {
    expect(pipe.transform(TicketPriority.HIGH)).toBe('Высокий');
  });

  it('returns dash for empty value', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
  });
});

describe('StatusLabelPipe', () => {
  const pipe = new StatusLabelPipe();

  it('maps status to label', () => {
    expect(pipe.transform(TicketStatus.IN_PROGRESS)).toBe('В работе');
  });

  it('returns dash for empty value', () => {
    expect(pipe.transform(null)).toBe('—');
  });
});
