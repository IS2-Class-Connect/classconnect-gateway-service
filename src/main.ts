import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './controllers/gateway.module';
import { validateEnv } from './config/validateEnv';
import 'dotenv/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create(GatewayModule);

  app.enableCors({
    origin: true,
    methods: 'GET,POST,PATCH,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  logger.log(`Server running at port ${process.env.PORT ?? 3000}`);
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
const logger = new Logger('Main');
