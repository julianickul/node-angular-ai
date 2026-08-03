import { registerAs } from '@nestjs/config';

// export const databaseSettings = {
//   host: process.env.DB_HOST || 'localhost',
// 	port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
// 	username: process.env.DB_USER || 'user',
//   password: process.env.DB_PASSWORD || '12345',
//   database: process.env.DB_NAME || 'nnaai_db',
//   ssl: process.env.DB_SSL === 'true',
//   synchronize: process.env.DB_SYNCHRONIZE === 'true',
//   logging: process.env.DB_LOGGING === 'true',
// };

// export const databaseConfig = registerAs('database', () => (databaseSettings));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
	port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
	username: process.env.DB_USER || 'user',
  password: process.env.DB_PASSWORD || '12345',
  database: process.env.DB_NAME || 'nnaai_db',
  ssl: process.env.DB_SSL === 'true',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'true',
}));
