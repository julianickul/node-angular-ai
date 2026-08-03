import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getTypeOrmConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'mysql',

  host: configService.get<string>('database.host'),
  port: configService.get<number>('database.port'),
  username: configService.get<string>('database.username'),
  password: configService.get<string>('database.password'),
  database: configService.get<string>('database.database'),

  // ВАЖНО:
  // TypeORM будет автоматически собирать entity из всех forFeature(...)
  autoLoadEntities: true,

  migrations: [
    __dirname + '/../infrastructure/database/migrations/*{.ts,.js}',
  ],
  migrationsTableName: 'migrations',

  synchronize: configService.get<boolean>('database.synchronize', false),
  logging: configService.get<boolean>('database.logging', false),

  extra: {
    connectionLimit: 10,
    connectTimeout: 10000,
  },

  retryAttempts: 3,
  retryDelay: 1000,
});
