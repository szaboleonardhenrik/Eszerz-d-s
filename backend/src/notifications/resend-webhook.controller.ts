import {
  Controller,
  Post,
  Req,
  Logger,
  HttpCode,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id?: string;
    from?: string;
    to?: string[];
    subject?: string;
    [key: string]: unknown;
  };
}

@Controller('webhooks/resend')
export class ResendWebhookController {
  private readonly logger = new Logger(ResendWebhookController.name);
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.webhookSecret = this.config.get<string>('RESEND_WEBHOOK_SECRET');
    if (!this.webhookSecret) {
      this.logger.warn(
        'RESEND_WEBHOOK_SECRET is not set. Webhook signature verification is disabled.',
      );
    }
  }

  @Post()
  @HttpCode(200)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: true }> {
    const svixId = req.headers['svix-id'] as string | undefined;
    const svixTimestamp = req.headers['svix-timestamp'] as string | undefined;
    const svixSignature = req.headers['svix-signature'] as string | undefined;

    // Verify webhook signature if secret is configured
    if (this.webhookSecret) {
      if (!svixId || !svixTimestamp || !svixSignature) {
        this.logger.warn('Missing Svix signature headers');
        return { received: true };
      }

      const rawBody = req.rawBody;
      if (!rawBody) {
        this.logger.warn('Raw body not available for signature verification');
        return { received: true };
      }

      if (!this.verifySignature(rawBody, svixId, svixTimestamp, svixSignature)) {
        this.logger.warn('Invalid webhook signature');
        return { received: true };
      }
    }

    const event: ResendWebhookEvent = req.body as ResendWebhookEvent;
    const eventType = event?.type;
    const resendId = event?.data?.email_id;

    if (!eventType || !resendId) {
      this.logger.warn('Webhook event missing type or email_id');
      return { received: true };
    }

    this.logger.log(`Received Resend webhook: ${eventType} for ${resendId}`);

    try {
      switch (eventType) {
        case 'email.delivered':
          await this.handleDelivered(resendId);
          break;
        case 'email.bounced':
          await this.handleBounced(resendId, event);
          break;
        case 'email.complained':
          await this.handleComplained(resendId, event);
          break;
        default:
          this.logger.debug(`Unhandled Resend event type: ${eventType}`);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process webhook ${eventType} for ${resendId}: ${message}`,
      );
    }

    return { received: true };
  }

  private verifySignature(
    rawBody: Buffer,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
  ): boolean {
    try {
      // Resend uses Svix for webhook delivery
      // Signature format: "v1,<base64-signature> v1,<base64-signature>"
      const signedContent = `${svixId}.${svixTimestamp}.${rawBody.toString('utf8')}`;

      // The secret from Resend starts with "whsec_" and the rest is base64-encoded
      const secretBytes = Buffer.from(
        this.webhookSecret!.replace(/^whsec_/, ''),
        'base64',
      );

      const expectedSignature = crypto
        .createHmac('sha256', secretBytes)
        .update(signedContent)
        .digest('base64');

      // svixSignature can contain multiple signatures separated by space
      const signatures = svixSignature.split(' ');
      return signatures.some((sig) => {
        const sigValue = sig.replace(/^v1,/, '');
        return crypto.timingSafeEqual(
          Buffer.from(sigValue),
          Buffer.from(expectedSignature),
        );
      });
    } catch {
      return false;
    }
  }

  private async handleDelivered(resendId: string): Promise<void> {
    const updated = await this.prisma.emailLog.updateMany({
      where: { resendId },
      data: { status: 'delivered' },
    });

    if (updated.count === 0) {
      this.logger.debug(`No EmailLog found for resendId: ${resendId}`);
    }
  }

  private async handleBounced(
    resendId: string,
    event: ResendWebhookEvent,
  ): Promise<void> {
    this.logger.warn(
      `Email bounced: resendId=${resendId}, to=${event.data.to?.join(', ') ?? 'unknown'}`,
    );

    const updated = await this.prisma.emailLog.updateMany({
      where: { resendId },
      data: {
        status: 'bounced',
        error: `Bounced at ${event.created_at}`,
      },
    });

    if (updated.count === 0) {
      this.logger.debug(`No EmailLog found for resendId: ${resendId}`);
    }
  }

  private async handleComplained(
    resendId: string,
    event: ResendWebhookEvent,
  ): Promise<void> {
    this.logger.warn(
      `Email complaint: resendId=${resendId}, to=${event.data.to?.join(', ') ?? 'unknown'}`,
    );

    const updated = await this.prisma.emailLog.updateMany({
      where: { resendId },
      data: {
        status: 'complained',
        error: `Complaint received at ${event.created_at}`,
      },
    });

    if (updated.count === 0) {
      this.logger.debug(`No EmailLog found for resendId: ${resendId}`);
    }
  }
}
