import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

function isError(error: unknown): error is Error {
  return error instanceof Error;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Проверка подключения к БД при старте
  const dataSource = app.get(DataSource);

  try {
    await dataSource.query('SELECT 1');
    console.log('✅ Database connected successfully');
  } catch (error) {
    if (isError(error)) {
      console.error('❌ Database connection failed:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error(' Unknown error occurred:', error);
    }
    process.exit(1);
  }

  const port = process.env.BACKEND_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application running on port 3000`);
}
bootstrap();
