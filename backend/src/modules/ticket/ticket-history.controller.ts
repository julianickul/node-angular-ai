import { Controller, Get, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole, ITicketHistoryStats } from '@nnaai/shared-types';
import { Roles } from '@/core/decorators/roles.decorator';
import { TicketHistoryService } from './ticket-history.service';

@ApiTags('ticket-history')
@Controller('ticket-history')
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
export class TicketHistoryController {
  constructor(private readonly ticketHistoryService: TicketHistoryService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Статистика изменений тикетов' })
  @ApiResponse({ status: 200, description: 'Сводка изменений' })
  getStats(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Query('recentLimit', new DefaultValuePipe(20), ParseIntPipe)
    recentLimit: number,
  ): Promise<ITicketHistoryStats> {
    return this.ticketHistoryService.getStats(days, recentLimit);
  }
}
