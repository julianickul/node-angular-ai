import { IUserResponse } from './user.interface';

export interface ITicketHistoryItem {
  id: number;
  ticketId: number;
  message: string;
  changedById: number | null;
  changedBy: IUserResponse | null;
  createdAt: string;
}

export interface ITicketHistoryDayStat {
  date: string;
  count: number;
}

export interface ITicketHistoryUserStat {
  userId: number | null;
  userName: string;
  count: number;
}

export interface ITicketHistoryStats {
  totalChanges: number;
  changesLast7Days: number;
  changesLast30Days: number;
  byDay: ITicketHistoryDayStat[];
  byUser: ITicketHistoryUserStat[];
  recent: ITicketHistoryItem[];
}
