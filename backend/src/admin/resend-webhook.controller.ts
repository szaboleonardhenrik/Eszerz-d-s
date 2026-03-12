import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Handles Resend webhook events for email delivery tracking.
 * Resend sends events: email.sent, email.delivered, email.bounced,
 * email.complained, email.delivery_delayed, email.opened, email.clicked
 */
@Controller('webhooks/resend')
export class ResendWebhookController {
  private readonly logger = new Logger(ResendWebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async handleWebhook(
    @Body() body: any,
    @Headers('svix-id') svixId?: string,
  ) {
    const { type, data } = body;

    if (!type || !data) {
      return { received: true };
    }

    const resendId = data.email_id;
    if (!resendId) {
      return { received: true };
    }

    const statusMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.delivery_delayed': 'sent',
    };

    const newStatus = statusMap[type];

    try {
      if (newStatus) {
        await this.prisma.emailLog.updateMany({
          where: { resendId },
          data: { status: newStatus },
        });
      }

      if (type === 'email.opened') {
        await this.prisma.emailLog.updateMany({
          where: { resendId },
          data: { openedAt: new Date(), status: 'delivered' },
        });
      }

      if (type === 'email.clicked') {
        await this.prisma.emailLog.updateMany({
          where: { resendId },
          data: { clickedAt: new Date() },
        });
      }
    } catch (err) {
      this.logger.warn(`Resend webhook processing failed: ${err}`);
    }

    return { received: true };
  }
}
