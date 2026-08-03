import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Текущий пароль (для подтверждения личности)',
    example: 'oldPassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Текущий пароль обязателен' })
  currentPassword!: string;

  @ApiProperty({
    description: 'Новый пароль',
    example: 'newStrongPassword456',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'Новый пароль обязателен' })
  @MinLength(6, { message: 'Пароль должен содержать минимум 6 символов' })
  @MaxLength(100, { message: 'Пароль не может быть длиннее 100 символов' })
  newPassword!: string;
}
