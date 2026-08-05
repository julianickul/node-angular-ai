import { Ticket } from '../entities/ticket.entity';

export interface PaginatedTicketsResponse {
  data: Ticket[];
  total: number;
  page: number;
  totalPages: number;
}
