// backend/src/api/modules/auth/auth.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AuthToken } from './entities/auth.entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(AuthToken)
    private readonly tokensRepo: Repository<AuthToken>,
  ) {}

  // === Методы для работы с пользователями ===

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      select: ['id', 'email', 'passwordHash', 'role', 'isActive'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({
      where: { id },
      relations: ['profile'],
    });
  }

  // === Методы для работы с токенами ===

  async findTokenByRefreshToken(refreshToken: string): Promise<AuthToken | null> {
    return this.tokensRepo.findOne({
      // where: { token: refreshToken },
      where: { refreshToken: refreshToken },
      relations: ['user'],
    });
  }

  async saveToken(userId: number, refreshToken: string, expiresAt: Date): Promise<void> {
    await this.tokensRepo.save({
      user: { id: userId },
      refreshToken,
      expiresAt,
    });
  }

  async revokeToken(refreshToken: string): Promise<void> {
    // await this.tokensRepo.delete({ token: refreshToken });
    await this.tokensRepo.delete({ refreshToken: refreshToken });
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.tokensRepo.delete({ user: { id: userId } });
  }
}
