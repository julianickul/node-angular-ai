import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, DataSource } from 'typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from '../users/entities/user.entity';
// import { AuthRepository } from './auth.repository';
import { UserRole, IUserResponse } from '@nnaai/shared-types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import { UserMapper } from '../users/users.mapper';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    // private readonly authRepo: AuthRepository,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    // private readonly dataSource: DataSource,
  ) {}

  /**
   * Регистрация нового пользователя
   */
  async register(dto: RegisterDto): Promise<IUserResponse> {
    // 1. Валидация email
    this.validateEmail(dto.email);

    // 2. Проверка уникальности email
    const existingUser = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // 3. Хеширование пароля
    const passwordHash = await this.hashPassword(dto.password);

    // 4. Создание пользователя
    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      role: dto.role || UserRole.USER,
    });

    const savedUser = await this.userRepo.save(user);

    // 5. Возвращаем без пароля
    return UserMapper.toResponse(savedUser);
  }

  /**
   * Валидация пользователя (для login)
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<IUserResponse | null> {
    // 1. Ищем пользователя с паролем (select: false отключаем явно)
    const user = await this.userRepo.findOne({
      where: { email: email.toLowerCase() },
      select: [
        'id',
        'email',
        'passwordHash',
        'firstName',
        'lastName',
        'role',
        'isActive',
      ],
    });

    if (!user) {
      return null;
    }

    // 2. Проверяем активность
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // 3. Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    // 4. Обновляем время последнего входа
    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    // 5. Возвращаем без пароля
    return UserMapper.toResponse(user);
  }

  /**
   * Login: валидация + генерация токенов
   */
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user);
    return { user, ...tokens };
  }

  /**
   * Хеширование пароля
   */
  private async hashPassword(password: string): Promise<string> {
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  /**
   * Валидация email
   */
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  /**
   * Генерация JWT токенов
   */
  private async generateTokens(user: IUserResponse) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync({ sub: user.id }, { expiresIn: '7d' }),
    ]);

    return { accessToken, refreshToken };
  }
}
