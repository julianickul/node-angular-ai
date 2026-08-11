import { TicketPriority, TicketStatus } from '../enums/tickets.enum';
import { IUserResponse } from './user.interface';

export interface ITicket {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  authorId: number;
  author: IUserResponse;
  assigneeId: number | null;
  assignee: IUserResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface ITicketCreate {
  title: string;
  description: string;
  priority?: TicketPriority;
  assigneeId?: number;
}

export interface ITicketUpdate {
  title?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: number | null;
}

export type TicketSortField =
  | 'id'
  | 'title'
  | 'priority'
  | 'status'
  | 'createdAt'
  | 'updatedAt'
  | 'assigneeId';

export type SortOrder = 'ASC' | 'DESC';

export interface ITicketQuery {
  page?: number;
  limit?: number;
  sortBy?: TicketSortField;
  sortOrder?: SortOrder;
  status?: TicketStatus;
  priority?: TicketPriority;
  assigneeId?: number;
  search?: string;
}
