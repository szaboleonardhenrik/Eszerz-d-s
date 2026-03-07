import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHmac } from 'crypto';

@Injectable()
export class WebhooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    const webhooks = await this.prisma.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return webhooks.map((w) => ({
      ...w,
      secret: w.secret.substring(0, 8) + '...',
    }));
  }

  private validateWebhookUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new NotFoundException('Érvénytelen webhook URL');
    }
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      throw new NotFoundException('Csak HTTP/HTTPS webhook URL engedélyezett');
    }
    const hostname = parsed.hostname.toLowerCase();
    const forbidden = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'];
    if (forbidden.includes(hostname) ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) {
      throw new NotFoundException('Belső hálózati cím nem engedélyezett webhook URL-ként');
    }
  }

  async create(
    userId: string,
    data: { url: string; events: string; secret?: string },
  ) {
    this.validateWebhookUrl(data.url);
    const secret = data.secret || `whsec_${randomBytes(24).toString('hex')}`;

    const webhook = await this.prisma.webhook.create({
      data: {
        userId,
        url: data.url,
        events: data.events,
        secret,
      },
    });

    // Return full secret only on creation
    return webhook;
  }

  async update(
    id: string,
    userId: string,
    data: { url?: string; events?: string; active?: boolean },
  ) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, userId },
    });
    if (!webhook) throw new NotFoundException('Webhook nem található');
    if (data.url) this.validateWebhookUrl(data.url);

    const updated = await this.prisma.webhook.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      secret: updated.secret.substring(0, 8) + '...',
    };
  }

  async delete(id: string, userId: string) {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id, userId },
    });
    if (!webhook) throw new NotFoundException('Webhook nem található');

    return this.prisma.webhook.delete({ where: { id } });
  }

  async triggerWebhooks(userId: string, event: string, payload: any) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        userId,
        active: true,
      },
    });

    const matching = webhooks.filter((w) =>
      w.events.split(',').includes(event),
    );

    for (const webhook of matching) {
      // Fire and forget
      const body = JSON.stringify({
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        });
      const signature = createHmac('sha256', webhook.secret)
        .update(body)
        .digest('hex');
      fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
        },
        body,
      })
        .then(async (res) => {
          if (!res.ok) {
            await this.prisma.webhook.update({
              where: { id: webhook.id },
              data: {
                lastError: `HTTP ${res.status}: ${res.statusText}`,
                lastTriggeredAt: new Date(),
              },
            });
          } else {
            await this.prisma.webhook.update({
              where: { id: webhook.id },
              data: {
                lastError: null,
                lastTriggeredAt: new Date(),
              },
            });
          }
        })
        .catch(async (err) => {
          await this.prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              lastError: err.message || 'Kapcsolódási hiba',
              lastTriggeredAt: new Date(),
            },
          });
        });
    }
  }
}
