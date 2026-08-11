import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { IUserResponse, UserRole } from '@nnaai/shared-types';
import { Roles } from '@/core/decorators/roles.decorator';
import { CurrentUser } from '@/core/decorators/current-user.decorator';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth-request.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<IUserResponse> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  async findAll(): Promise<IUserResponse[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<IUserResponse> {
    return this.usersService.findOneById(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<IUserResponse> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(':id/password')
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() changePasswordDto: ChangePasswordDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    if (user.id !== id && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Можно менять только свой пароль');
    }

    return this.usersService.changePassword(
      id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    if (user.id === id) {
      throw new ForbiddenException('Нельзя удалить собственный аккаунт');
    }

    return this.usersService.remove(id);
  }
}
