import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// import { User } from '../users/entities/user.entity';
// import { AuthToken } from './entities/auth.entity';
import { User, AuthToken } from '@/shared/entities/index';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtStrategy
  ],
  imports: [
    // Регистрируем репозитории для TypeORM
    TypeOrmModule.forFeature([User, AuthToken]),

    // Регистрируем JwtModule с асинхронной конфигурацией
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          // expiresIn: '15m',
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
    }),
  ],
  exports: [AuthService],
})
export class AuthModule {}
