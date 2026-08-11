import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '@nnaai/shared-types';

/**
 * DTO для обновления тикета через API
 * Поддерживается частичное обновление (PATCH)
 */
export class UpdateTicketDto {
  @ApiPropertyOptional({
    description: 'Заголовок тикета (автор может менять только у open-заявки)',
    example: 'Не работает авторизация',
  })
  @IsOptional()
  @IsString({ message: 'Заголовок должен быть строкой' })
  @MinLength(3, { message: 'Заголовок должен содержать минимум 3 символа' })
  @MaxLength(255, { message: 'Заголовок не может быть длиннее 255 символов' })
  title?: string;

  @ApiPropertyOptional({
    description: 'Описание проблемы (автор может менять только у open-заявки)',
  })
  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  @MinLength(10, { message: 'Описание должно содержать минимум 10 символов' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Статус тикета (только moderator/admin)',
    enum: TicketStatus,
  })
  @IsOptional()
  @IsEnum(TicketStatus, {
    message: `Статус должен быть одним из: ${Object.values(TicketStatus).join(', ')}`,
  })
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Приоритет тикета (только moderator/admin)',
    enum: TicketPriority,
  })
  @IsOptional()
  @IsEnum(TicketPriority, {
    message: `Приоритет должен быть одним из: ${Object.values(TicketPriority).join(', ')}`,
  })
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'ID исполнителя. Передайте null, чтобы снять исполнителя (только moderator/admin)',
    example: 2,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt({ message: 'ID исполнителя должен быть целым числом' })
  @Min(1, { message: 'ID исполнителя должен быть положительным числом' })
  assigneeId?: number | null;
}
