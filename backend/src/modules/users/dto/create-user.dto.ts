import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@nnaai/shared-types';

/**
 * DTO для создания пользователя через API
 * Используется с ValidationPipe для автоматической валидации
 */
export class CreateUserDto {
  @ApiProperty({
    description: 'Email пользователя',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Неверный формат email' })
  @IsNotEmpty({ message: 'Email обязателен' })
  @MaxLength(255, { message: 'Email не может быть длиннее 255 символов' })
  email!: string;

  @ApiProperty({
    description: 'Имя пользователя',
    example: 'Иван',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Имя должно быть строкой' })
  @IsNotEmpty({ message: 'Имя обязательно' })
  @MinLength(2, { message: 'Имя должно содержать минимум 2 символа' })
  @MaxLength(100, { message: 'Имя не может быть длиннее 100 символов' })
  firstName!: string;

  @ApiProperty({
    description: 'Фамилия пользователя',
    example: 'Иванов',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Фамилия должна быть строкой' })
  @IsNotEmpty({ message: 'Фамилия обязательна' })
  @MinLength(2, { message: 'Фамилия должна содержать минимум 2 символа' })
  @MaxLength(100, { message: 'Фамилия не может быть длиннее 100 символов' })
  lastName!: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'strongPassword123',
    minLength: 6,
  })
  @IsString({ message: 'Пароль должен быть строкой' })
  @IsNotEmpty({ message: 'Пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @MaxLength(100, { message: 'Пароль не может быть длиннее 100 символов' })
  password!: string;

  @ApiPropertyOptional({
    description: 'Роль пользователя',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, {
    message: `Роль должна быть одной из: ${Object.values(UserRole).join(', ')}`,
  })
  role?: UserRole;
}
