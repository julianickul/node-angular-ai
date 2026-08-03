import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@nnaai/shared-types';

/**
 * DTO для обновления пользователя через API
 * Все поля опциональны — поддерживается частичное обновление (PATCH)
 */
export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Email пользователя',
    example: 'newemail@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Неверный формат email' })
  @MaxLength(255, { message: 'Email не может быть длиннее 255 символов' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Имя пользователя',
    example: 'Иван',
  })
  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой' })
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(100, { message: 'Имя не может быть длиннее 100 символов' })
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Фамилия пользователя',
    example: 'Иванов',
  })
  @IsOptional()
  @IsString({ message: 'Фамилия должна быть строкой' })
  @MinLength(2, { message: 'Фамилия должна содержать минимум 2 символа' })
  @MaxLength(100, { message: 'Фамилия не может быть длиннее 100 символов' })
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Роль пользователя',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: `Роль должна быть одной из: ${Object.values(UserRole).join(', ')}`,
  })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Статус активности пользователя',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'Статус активности должен быть boolean' })
  isActive?: boolean;
}
