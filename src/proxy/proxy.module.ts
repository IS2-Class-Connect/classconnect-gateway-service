import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [ProxyController],
})
export class ProxyModule {}
