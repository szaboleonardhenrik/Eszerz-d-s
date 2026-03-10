import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { QuotesService } from './quotes.service';
import { QuotesController, QuoteViewController } from './quotes.controller';

@Module({
  imports: [PrismaModule, WebhooksModule],
  controllers: [QuotesController, QuoteViewController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
