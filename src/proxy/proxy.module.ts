import { Module } from '@nestjs/common';
import { ProxyController } from './proxy.controller';
import { HttpModule } from '@nestjs/axios';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [FirebaseModule, HttpModule],
  controllers: [ProxyController],
})
export class ProxyModule {}
