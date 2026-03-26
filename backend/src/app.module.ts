import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ApiUsageInterceptor } from './admin/api-usage.interceptor';
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
import { QuotesModule } from './quotes/quotes.module';
import { RemindersModule } from './reminders/reminders.module';
import { NotificationsGatewayModule } from './notifications-gateway/notifications-gateway.module';
import { ChatModule } from './chat/chat.module';
import { PortalModule } from './portal/portal.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { SearchModule } from './search/search.module';
import { TsaModule } from './tsa/tsa.module';
import { CreditsModule } from './credits/credits.module';
import { ClausesModule } from './clauses/clauses.module';
import { PartnerMonitorModule } from './partner-monitor/partner-monitor.module';
import { FeatureFlagsController } from './common/feature-flags.controller';
import { MaintenanceMiddleware } from './common/maintenance.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60000, limit: 30 }] }),
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
    QuotesModule,
    RemindersModule,
    NotificationsGatewayModule,
    ChatModule,
    PortalModule,
    AdminModule,
    HealthModule,
    SearchModule,
    TsaModule,
    CreditsModule,
    ClausesModule,
    PartnerMonitorModule,
  ],
  controllers: [FeatureFlagsController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ApiUsageInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MaintenanceMiddleware).forRoutes('*');
  }
}
