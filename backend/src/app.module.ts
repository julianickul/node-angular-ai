import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { getTypeOrmConfig } from './config/typeorm.config';
import { GlobalJwtGuard } from './core/guards/global-jwt.guard';
import { RolesGuard } from './core/guards/roles.guard';
import { RequestContextInterceptor } from './core/interceptors/request-context.interceptor';
import { SanitizeResponseInterceptor } from './core/interceptors/sanitize-response.interceptor';

// Импорт фич-модулей
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { TicketModule } from '@/modules/ticket/ticket.module';

@Module({
  imports: [
    // 1. Глобальный ConfigModule (читает .env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig],  // Регистрируем namespace 'database'
    }),

    // 2. TypeORM через forRootAsync
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmConfig(configService),
    }),

    // 3. Бизнес-модули
    AuthModule,
    UsersModule,
    TicketModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GlobalJwtGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: SanitizeResponseInterceptor,
    },
  ],
})
export class AppModule {}
