import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from '../users/entities/user.entity';
import { AuthToken } from './entities/auth.entity';
import { UserRole, IUserResponse } from '@nnaai/shared-types';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UserMapper } from '../users/users.mapper';

@Injectable()
export class AuthService {
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(AuthToken)
    private readonly tokensRepo: Repository<AuthToken>,

    private readonly jwtService: JwtService,
  ) {}

  /**
   * Регистрация нового пользователя
   */
  async register(dto: RegisterDto): Promise<IUserResponse> {
    this.validateEmail(dto.email);

    const existingUser = await this.userRepo.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const user = this.userRepo.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      role: UserRole.USER,
    });

    const savedUser = await this.userRepo.save(user);
    return UserMapper.toResponse(savedUser);
  }

  /**
   * Валидация пользователя (для login)
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<IUserResponse | null> {
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

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

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

    // Сохраняем refresh token в БД
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user, ...tokens };
  }

  /**
   * Обновление токенов по Refresh Token
   */
  async refreshTokens(dto: RefreshTokenDto) {
    const { refreshToken } = dto;

    // 1. Ищем токен в БД
    const storedToken = await this.tokensRepo.findOne({
      where: {
        refreshToken,
        isRevoked: false,
        expiresAt: MoreThan(new Date()), // Проверяем, что не истек
      },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // 2. Верифицируем JWT
    try {
      const payload = this.jwtService.verify(refreshToken);

      // 3. Проверяем, что пользователь активен
      const user = await this.userRepo.findOne({
        where: { id: payload.sub, isActive: true },
      });

      if (!user) {
        throw new UnauthorizedException('User not found or inactive');
      }

      // 4. Удаляем старый refresh token
      await this.tokensRepo.delete({ id: storedToken.id });

      // 5. Генерируем новые токены
      const userResponse = UserMapper.toResponse(user);
      const newTokens = await this.generateTokens(userResponse);

      // 6. Сохраняем новый refresh token
      await this.saveRefreshToken(user.id, newTokens.refreshToken);

      return {
        user: userResponse,
        ...newTokens,
      };
    } catch (error) {
      // Если JWT не валидный — удаляем токен из БД
      await this.tokensRepo.delete({ id: storedToken.id });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Выход (logout) — удаляем refresh token
   */
  async logout(refreshToken: string) {
    const storedToken = await this.tokensRepo.findOne({
      where: { refreshToken },
    });

    if (storedToken) {
      // Можно удалить или пометить как revoked
      await this.tokensRepo.delete({ id: storedToken.id });
      // Или: await this.tokensRepo.update(storedToken.id, { isRevoked: true });
    }

    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Выход со всех устройств
   */
  async logoutAllDevices(userId: number) {
    await this.tokensRepo.delete({ user: { id: userId } });
    return { success: true, message: 'Logged out from all devices' };
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
      this.jwtService.signAsync(
        { sub: user.id },
        { expiresIn: '7d' }
      ),
    ]);

    return { accessToken, refreshToken };
  }

  /**
   * Сохранение Refresh Token в БД
   */
  private async saveRefreshToken(userId: number, refreshToken: string) {
    // Удаляем старые токены пользователя (опционально, если хотим 1 активную сессию)
    // await this.tokensRepo.delete({ user: { id: userId } });

    // Создаем новый токен
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 дней

    await this.tokensRepo.save({
      user: { id: userId },
      refreshToken,
      expiresAt,
      isRevoked: false,
    });
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
}
