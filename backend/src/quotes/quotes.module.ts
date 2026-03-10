import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { InvoicingModule } from '../invoicing/invoicing.module';
import { QuotesService } from './quotes.service';
import { QuotesController, QuoteViewController } from './quotes.controller';

@Module({
  imports: [PrismaModule, WebhooksModule, InvoicingModule],
  controllers: [QuotesController, QuoteViewController],
  providers: [QuotesService],
  exports: [QuotesService],
})
export class QuotesModule {}
