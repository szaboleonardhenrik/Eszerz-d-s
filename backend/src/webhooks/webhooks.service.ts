import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHmac, randomUUID } from 'crypto';
import { encrypt, decrypt } from '../common/encryption.util';

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 2000;
const BACKOFF_MULTIPLIER = 4;
const AUTO_DISABLE_THRESHOLD = 5;
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_DEDUP_ENTRIES = 1000;

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);
  private recentEventIds = new Map<string, number>(); // eventId -> timestamp

  constructor(private readonly prisma: PrismaService) {}

  private isDuplicate(webhookId: string, event: string, entityId?: string): boolean {
    // Evict expired entries periodically
    if (this.recentEventIds.size > MAX_DEDUP_ENTRIES) {
      const now = Date.now();
      for (const [key, ts] of this.recentEventIds) {
        if (now - ts > DEDUP_WINDOW_MS) this.recentEventIds.delete(key);
      }
    }

    const dedupKey = `${webhookId}:${event}:${entityId || ''}`;
    const existing = this.recentEventIds.get(dedupKey);
    if (existing && Date.now() - existing < DEDUP_WINDOW_MS) {
      return true;
    }
    this.recentEventIds.set(dedupKey, Date.now());
    return false;
  }

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
    const plaintextSecret = data.secret || `whsec_${randomBytes(24).toString('hex')}`;
    const encryptedSecret = encrypt(plaintextSecret);

    const webhook = await this.prisma.webhook.create({
      data: {
        userId,
        url: data.url,
        events: data.events,
        secret: encryptedSecret,
      },
    });

    // Return plaintext secret on creation so the user can store it
    return { ...webhook, secret: plaintextSecret };
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

  /**
   * Sanitize a webhook payload by redacting PII fields before sending
   * to external webhook endpoints.
   */
  private sanitizePayload(payload: any): any {
    if (!payload || typeof payload !== 'object') return payload;

    const redacted = Array.isArray(payload) ? [...payload] : { ...payload };

    const emailFields = ['email', 'clientEmail', 'signerEmail', 'ownerEmail', 'recipientEmail'];
    const removeFields = ['phone', 'clientPhone', 'taxNumber', 'clientTaxNumber', 'address', 'clientAddress'];
    const nameFields = ['clientName', 'signerName', 'recipientName'];

    for (const key of Object.keys(redacted)) {
      // Mask email fields: "john@example.com" -> "j***@example.com"
      if (emailFields.includes(key) && typeof redacted[key] === 'string') {
        const email = redacted[key] as string;
        const atIdx = email.indexOf('@');
        if (atIdx > 0) {
          redacted[key] = email[0] + '***' + email.substring(atIdx);
        }
        continue;
      }

      // Remove sensitive fields entirely
      if (removeFields.includes(key)) {
        delete redacted[key];
        continue;
      }

      // Mask name fields: "John Doe" -> "J***"
      if (nameFields.includes(key) && typeof redacted[key] === 'string') {
        const name = redacted[key] as string;
        redacted[key] = name.length > 0 ? name[0] + '***' : '***';
        continue;
      }

      // Recursively sanitize nested objects
      if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.sanitizePayload(redacted[key]);
      }
    }

    return redacted;
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

    const entityId = payload?.id || payload?.contractId || '';
    const sanitizedPayload = this.sanitizePayload(payload);

    for (const webhook of matching) {
      if (this.isDuplicate(webhook.id, event, entityId)) {
        this.logger.debug(`Webhook ${webhook.id} deduplicated for ${event}:${entityId}`);
        continue;
      }
      const eventId = randomUUID();
      this.deliverWithRetry(webhook, event, sanitizedPayload, eventId).catch(() => {
        // Background task - errors handled internally
      });
    }
  }

  private async deliverWithRetry(
    webhook: { id: string; url: string; secret: string; failedCount: number },
    event: string,
    payload: any,
    eventId: string,
  ) {
    const body = JSON.stringify({
      id: eventId,
      event,
      timestamp: new Date().toISOString(),
      data: payload,
    });
    const decryptedSecret = decrypt(webhook.secret);
    const signature = createHmac('sha256', decryptedSecret)
      .update(body)
      .digest('hex');

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': event,
      'X-Webhook-Id': eventId,
    };

    let lastError: string | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        const delay = BACKOFF_BASE_MS * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
        this.logger.debug(
          `Webhook ${webhook.id} retry ${attempt}/${MAX_RETRIES} in ${delay}ms`,
        );
        await this.sleep(delay);
      }

      const startMs = Date.now();
      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body,
          signal: AbortSignal.timeout(10000),
        });

        const durationMs = Date.now() - startMs;
        const resBody = await res.text().catch(() => '');

        // Log delivery attempt
        this.prisma.webhookDeliveryLog.create({
          data: {
            webhookId: webhook.id,
            event,
            url: webhook.url,
            statusCode: res.status,
            responseBody: resBody.substring(0, 500),
            attempt: attempt + 1,
            success: res.ok,
            durationMs,
          },
        }).catch(() => {});

        if (res.ok) {
          await this.prisma.webhook.update({
            where: { id: webhook.id },
            data: {
              lastError: null,
              lastTriggeredAt: new Date(),
              failedCount: 0,
            },
          });
          this.logger.debug(
            `Webhook ${webhook.id} delivered (attempt ${attempt + 1})`,
          );
          return;
        }

        lastError = `HTTP ${res.status}: ${res.statusText}`;
      } catch (err: any) {
        const durationMs = Date.now() - startMs;
        lastError = err.message || 'Kapcsolódási hiba';

        // Log failed attempt
        this.prisma.webhookDeliveryLog.create({
          data: {
            webhookId: webhook.id,
            event,
            url: webhook.url,
            error: lastError,
            attempt: attempt + 1,
            success: false,
            durationMs,
          },
        }).catch(() => {});
      }

      this.logger.warn(
        `Webhook ${webhook.id} attempt ${attempt + 1} failed: ${lastError}`,
      );
    }

    // All retries exhausted
    const newFailedCount = webhook.failedCount + 1;
    const shouldDisable = newFailedCount >= AUTO_DISABLE_THRESHOLD;

    const errorMessage = shouldDisable
      ? `Automatikusan kikapcsolva ${AUTO_DISABLE_THRESHOLD} egymást követő hiba után. Utolsó hiba: ${lastError}`
      : `${MAX_RETRIES + 1} próba sikertelen. Hiba: ${lastError} (${newFailedCount}/${AUTO_DISABLE_THRESHOLD} hiba)`;

    await this.prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        lastError: errorMessage,
        lastTriggeredAt: new Date(),
        failedCount: newFailedCount,
        ...(shouldDisable ? { active: false } : {}),
      },
    });

    if (shouldDisable) {
      this.logger.error(
        `Webhook ${webhook.id} auto-disabled after ${AUTO_DISABLE_THRESHOLD} consecutive failures`,
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
