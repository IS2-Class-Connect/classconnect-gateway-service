import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { HttpModule } from '@nestjs/axios';
import { NotificationModule } from '../services/notification.module';
import { ProxyModule } from '../services/proxy.module';
import { GatewayController } from './gateway.controller';

@Module({
  imports: [FirebaseModule, HttpModule, NotificationModule, ProxyModule],
  controllers: [GatewayController],
})
export class GatewayModule {}
