import { IsEnum, IsInt, IsOptional, Min, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '@nnaai/shared-types';

/**
 * DTO для обновления тикета через API
 * Поддерживается частичное обновление (PATCH)
 */
export class UpdateTicketDto {
  @ApiPropertyOptional({
    description: 'Статус тикета',
    enum: TicketStatus,
  })
  @IsOptional()
  @IsEnum(TicketStatus, {
    message: `Статус должен быть одним из: ${Object.values(TicketStatus).join(', ')}`,
  })
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Приоритет тикета',
    enum: TicketPriority,
  })
  @IsOptional()
  @IsEnum(TicketPriority, {
    message: `Приоритет должен быть одним из: ${Object.values(TicketPriority).join(', ')}`,
  })
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'ID исполнителя. Передайте null, чтобы снять исполнителя',
    example: 2,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt({ message: 'ID исполнителя должен быть целым числом' })
  @Min(1, { message: 'ID исполнителя должен быть положительным числом' })
  assigneeId?: number | null;
}
