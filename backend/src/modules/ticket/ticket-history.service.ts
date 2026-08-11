import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketHistory } from './entities/ticket-history.entity';
import {
  ITicketHistoryItem,
  ITicketHistoryStats,
  ITicketHistoryUserStat,
} from '@nnaai/shared-types';
import { UserMapper } from '@/modules/users/users.mapper';

@Injectable()
export class TicketHistoryService {
  constructor(
    @InjectRepository(TicketHistory)
    private readonly historyRepository: Repository<TicketHistory>,
  ) {}

  async getStats(days = 30, recentLimit = 20): Promise<ITicketHistoryStats> {
    const safeDays = Math.min(Math.max(days, 1), 90);
    const safeRecentLimit = Math.min(Math.max(recentLimit, 1), 100);

    const now = new Date();
    const start30 = this.startOfDay(this.daysAgo(now, 29));
    const start7 = this.startOfDay(this.daysAgo(now, 6));
    const rangeStart = this.startOfDay(this.daysAgo(now, safeDays - 1));

    const [totalChanges, changesLast7Days, changesLast30Days, byDayRaw, byUserRaw, recentEntities] =
      await Promise.all([
        this.historyRepository.count(),
        this.historyRepository
          .createQueryBuilder('h')
          .where('h.createdAt >= :start7', { start7 })
          .getCount(),
        this.historyRepository
          .createQueryBuilder('h')
          .where('h.createdAt >= :start30', { start30 })
          .getCount(),
        this.historyRepository
          .createQueryBuilder('h')
          .select('DATE(h.created_at)', 'date')
          .addSelect('COUNT(*)', 'count')
          .where('h.createdAt >= :rangeStart', { rangeStart })
          .groupBy('DATE(h.created_at)')
          .orderBy('date', 'ASC')
          .getRawMany<{ date: string | Date; count: string }>(),
        this.historyRepository
          .createQueryBuilder('h')
          .leftJoin('h.changedBy', 'user')
          .select('h.changed_by_id', 'userId')
          .addSelect('user.first_name', 'firstName')
          .addSelect('user.last_name', 'lastName')
          .addSelect('COUNT(*)', 'count')
          .groupBy('h.changed_by_id')
          .addGroupBy('user.first_name')
          .addGroupBy('user.last_name')
          .orderBy('count', 'DESC')
          .limit(10)
          .getRawMany<{
            userId: number | string | null;
            firstName: string | null;
            lastName: string | null;
            count: string;
          }>(),
        this.historyRepository.find({
          relations: ['changedBy'],
          order: { createdAt: 'DESC' },
          take: safeRecentLimit,
        }),
      ]);

    const byDayMap = new Map(
      byDayRaw.map((row) => [this.toDateKey(row.date), Number(row.count)]),
    );

    const byDay = Array.from({ length: safeDays }, (_, index) => {
      const date = this.toDateKey(this.daysAgo(now, safeDays - 1 - index));
      return {
        date,
        count: byDayMap.get(date) ?? 0,
      };
    });

    const byUser: ITicketHistoryUserStat[] = byUserRaw.map((row) => {
      const userId =
        row.userId === null || row.userId === undefined
          ? null
          : Number(row.userId);

      const userName =
        row.firstName || row.lastName
          ? `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim()
          : 'Система';

      return {
        userId,
        userName,
        count: Number(row.count),
      };
    });

    const recent: ITicketHistoryItem[] = recentEntities.map((item) =>
      this.toHistoryItem(item),
    );

    return {
      totalChanges,
      changesLast7Days,
      changesLast30Days,
      byDay,
      byUser,
      recent,
    };
  }

  private toHistoryItem(item: TicketHistory): ITicketHistoryItem {
    return {
      id: item.id,
      ticketId: item.ticketId,
      message: item.message,
      changedById: item.changedById,
      changedBy: item.changedBy ? UserMapper.toResponse(item.changedBy) : null,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private daysAgo(from: Date, days: number): Date {
    const date = new Date(from);
    date.setDate(date.getDate() - days);
    return date;
  }

  private startOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private toDateKey(value: string | Date): string {
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }

    return String(value).slice(0, 10);
  }
}
