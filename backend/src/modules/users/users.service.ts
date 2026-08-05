import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './entities/user.entity';
import { UserMapper } from './users.mapper';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUserResponse, UserRole } from '@nnaai/shared-types';

@Injectable()
export class UsersService {
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<IUserResponse[]> {
    const users = await this.userRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return UserMapper.toResponseList(users);
  }

  async findOneById(id: number): Promise<IUserResponse> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }
    return UserMapper.toResponse(user);
  }

  async findOneByEmail(email: string): Promise<IUserResponse | null> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    return user ? UserMapper.toResponse(user) : null;
  }

  async create(createUserDto: CreateUserDto): Promise<IUserResponse> {
    const normalizedEmail = createUserDto.email.toLowerCase();

    const existingUser = await this.userRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(
      createUserDto.password,
      this.BCRYPT_ROUNDS,
    );

    const newUser = this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      firstName: createUserDto.firstName.trim(),
      lastName: createUserDto.lastName.trim(),
      role: createUserDto.role || UserRole.USER,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(newUser);
    return UserMapper.toResponse(savedUser);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<IUserResponse> {
    // Нормализуем email, если он передан
    if (updateUserDto.email) {
      updateUserDto.email = updateUserDto.email.toLowerCase();

      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Этот email уже используется другим пользователем');
      }
    }

    await this.userRepository.update(id, updateUserDto);
    return this.findOneById(id);
  }

  async changePassword(
    id: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'passwordHash'],
    });

    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    // Проверяем текущий пароль
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Неверный текущий пароль');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('Пароль должен содержать минимум 6 символов');
    }

    const passwordHash = await bcrypt.hash(newPassword, this.BCRYPT_ROUNDS);
    await this.userRepository.update(id, { passwordHash });
  }

  async toggleActiveStatus(id: number): Promise<IUserResponse> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);
    return UserMapper.toResponse(user);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Пользователь с ID ${id} не найден`);
    }
  }
}
