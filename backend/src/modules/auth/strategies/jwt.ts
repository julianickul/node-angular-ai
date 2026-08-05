import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@/modules/users/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    // private
    configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      // Извлекаем токен из заголовка Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Автоматически отклоняем просроченные токены
      ignoreExpiration: false,

      // Секрет для верификации
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * Валидация payload из JWT
   * Эта функция вызывается после успешной верификации подписи
   */
  async validate(payload: any) {
    // payload содержит: { sub: user.id, email: user.email, role: user.role, ... }
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Возвращаем пользователя — он будет доступен в req.user
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
