import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TemplatesModule } from './templates/templates.module';
import { ContractsModule } from './contracts/contracts.module';
import { SignaturesModule } from './signatures/signatures.module';
import { AuditModule } from './audit/audit.module';
import { StorageModule } from './storage/storage.module';
import { PdfModule } from './pdf/pdf.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TeamsModule } from './teams/teams.module';
import { ApiKeysModule } from './apikeys/apikeys.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { BillingModule } from './billing/billing.module';
import { InvoicingModule } from './invoicing/invoicing.module';
import { AiModule } from './ai/ai.module';
import { CommentsModule } from './comments/comments.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { TagsModule } from './tags/tags.module';
import { FoldersModule } from './folders/folders.module';
import { ContactsModule } from './contacts/contacts.module';
import { InAppNotificationsModule } from './in-app-notifications/in-app-notifications.module';
import { ReferralsModule } from './referrals/referrals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    StorageModule,
    PdfModule,
    NotificationsModule,
    AuthModule,
    TemplatesModule,
    ContractsModule,
    SignaturesModule,
    TeamsModule,
    ApiKeysModule,
    SchedulerModule,
    BillingModule,
    InvoicingModule,
    AiModule,
    CommentsModule,
    WebhooksModule,
    TagsModule,
    FoldersModule,
    ContactsModule,
    InAppNotificationsModule,
    ReferralsModule,
  ],
})
export class AppModule {}
