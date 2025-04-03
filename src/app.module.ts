import { Module } from '@nestjs/common';
import { PingModule } from './modules/ping.module';

@Module({
  imports: [PingModule],
})
export class AppModule {}
