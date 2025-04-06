import { NestFactory } from '@nestjs/core';
import { ProxyModule } from './proxy/proxy.module'

async function bootstrap() {
  const app = await NestFactory.create(ProxyModule);
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
