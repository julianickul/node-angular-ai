import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority } from '@nnaai/shared-types';

/**
 * DTO для создания тикета через API
 */
export class CreateTicketDto {
  @ApiProperty({
    description: 'Заголовок тикета',
    example: 'Не работает авторизация',
    maxLength: 255,
  })
  @IsString({ message: 'Заголовок должен быть строкой' })
  @IsNotEmpty({ message: 'Заголовок обязателен' })
  @MinLength(3, { message: 'Заголовок должен содержать минимум 3 символа' })
  @MaxLength(255, { message: 'Заголовок не может быть длиннее 255 символов' })
  title!: string;

  @ApiProperty({
    description: 'Описание проблемы',
    example: 'При входе в систему появляется ошибка 500',
  })
  @IsString({ message: 'Описание должно быть строкой' })
  @IsNotEmpty({ message: 'Описание обязательно' })
  @MinLength(10, { message: 'Описание должно содержать минимум 10 символов' })
  description!: string;

  @ApiPropertyOptional({
    description: 'Приоритет тикета',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TicketPriority, {
    message: `Приоритет должен быть одним из: ${Object.values(TicketPriority).join(', ')}`,
  })
  priority?: TicketPriority;

  @ApiPropertyOptional({
    description: 'ID исполнителя тикета',
    example: 2,
  })
  @IsOptional()
  @IsInt({ message: 'ID исполнителя должен быть целым числом' })
  @Min(1, { message: 'ID исполнителя должен быть положительным числом' })
  assigneeId?: number;
}
