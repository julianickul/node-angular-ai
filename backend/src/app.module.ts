import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { getTypeOrmConfig } from './config/typeorm.config';

// Импорт фич-модулей
import { AuthModule } from '@module/auth/auth.module';
import { UsersModule } from '@module/users/users.module';

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
  ],
})
export class AppModule {}
