// backend/typeorm-cli.datasource.ts
import { DataSource } from 'typeorm';
// import { User } from '@module/users/entities/user.entity';
// import { AuthToken } from '@module/auth/entities/auth.entity';
// import { databaseSettings } from '@config/database.config';
import * as entities from './shared/entities';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем .env из корня монорепозитория
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// export default new DataSource({
//   type: 'mysql',
//   entities: [User, AuthToken], // Дублируем список
//   migrations: [__dirname + '/src/infrastructure/database/migrations/*.ts'],
//   migrationsTableName: 'migrations',
//   ...databaseSettings,
// });

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  username: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'nnaai_db',
  ssl: process.env.DB_SSL === 'true',
  synchronize: false, // CLI всегда false
  logging: true,
  entities: Object.values(entities),
  migrations: [__dirname + '/infrastructure/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
});
