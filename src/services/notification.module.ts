import { Module } from '@nestjs/common';
import { PushService } from './push.service';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
import { PushModule } from './push.module';
import { EmailModule } from './email.module';

@Module({
  imports: [PushModule, EmailModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
