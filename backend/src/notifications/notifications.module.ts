import { Global, Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ResendWebhookController } from './resend-webhook.controller';

@Global()
@Module({
  controllers: [ResendWebhookController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
