import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ResendWebhookController } from './resend-webhook.controller';
import { TestingController } from './testing.controller';
import { InAppNotificationsModule } from '../in-app-notifications/in-app-notifications.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [
    InAppNotificationsModule,
    CreditsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AdminController, ResendWebhookController, TestingController],
  providers: [AdminService],
})
export class AdminModule {}
