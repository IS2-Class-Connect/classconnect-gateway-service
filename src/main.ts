import { NestFactory } from '@nestjs/core';
import { ProxyModule } from './proxy/proxy.module'
import { validateEnv } from './config/validateEnv';
import 'dotenv/config'; 

async function bootstrap() {

  validateEnv();

  const app = await NestFactory.create(ProxyModule);
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
