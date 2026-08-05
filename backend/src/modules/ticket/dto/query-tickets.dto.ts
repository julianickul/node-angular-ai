import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '@nnaai/shared-types';

export enum TicketSortField {
  ID = 'id',
  TITLE = 'title',
  PRIORITY = 'priority',
  STATUS = 'status',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  ASSIGNEE_ID = 'assigneeId',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class QueryTicketsDto {
  @ApiPropertyOptional({ description: 'Номер страницы', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page должен быть целым числом' })
  @Min(1, { message: 'page должен быть не меньше 1' })
  page: number = 1;

  @ApiPropertyOptional({
    description: 'Количество записей на странице',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit должен быть целым числом' })
  @Min(1, { message: 'limit должен быть не меньше 1' })
  @Max(100, { message: 'limit не может быть больше 100' })
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Поле для сортировки',
    enum: TicketSortField,
    default: TicketSortField.CREATED_AT,
  })
  @IsOptional()
  @IsEnum(TicketSortField, {
    message: `sortBy должен быть одним из: ${Object.values(TicketSortField).join(', ')}`,
  })
  sortBy: TicketSortField = TicketSortField.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Направление сортировки',
    enum: SortOrder,
    default: SortOrder.DESC,
  })
  @IsOptional()
  @IsEnum(SortOrder, {
    message: `sortOrder должен быть одним из: ${Object.values(SortOrder).join(', ')}`,
  })
  sortOrder: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Фильтр по статусу',
    enum: TicketStatus,
  })
  @IsOptional()
  @IsEnum(TicketStatus, {
    message: `status должен быть одним из: ${Object.values(TicketStatus).join(', ')}`,
  })
  status?: TicketStatus;

  @ApiPropertyOptional({
    description: 'Фильтр по приоритету',
    enum: TicketPriority,
  })
  @IsOptional()
  @IsEnum(TicketPriority, {
    message: `priority должен быть одним из: ${Object.values(TicketPriority).join(', ')}`,
  })
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'Фильтр по ID исполнителя',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'assigneeId должен быть целым числом' })
  @Min(1, { message: 'assigneeId должен быть положительным числом' })
  assigneeId?: number;

  @ApiPropertyOptional({
    description: 'Поиск по заголовку',
    example: 'авторизация',
  })
  @IsOptional()
  @IsString({ message: 'search должен быть строкой' })
  search?: string;
}
