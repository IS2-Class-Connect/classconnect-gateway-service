import { NestFactory } from '@nestjs/core';
import { ProxyModule } from './proxy/proxy.module';
import { validateEnv } from './config/validateEnv';
import 'dotenv/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(ProxyModule);
  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Server running at port ${process.env.PORT ?? 3000}`);
}

void bootstrap();

const logger = new Logger('Main');
