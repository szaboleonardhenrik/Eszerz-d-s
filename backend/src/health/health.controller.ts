import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

@Controller('health')
export class HealthController {
  private readonly startTime = Date.now();
  private readonly logger = new Logger('ClientError');

  constructor(private readonly prisma: PrismaService) {}

  @Post('client-error')
  logClientError(@Body() body: { message?: string; stack?: string; url?: string; type?: string }) {
    this.logger.error(`[CLIENT] ${body.url} — ${body.message}\n${body.stack ?? ''}`);
    return { ok: true };
  }

  @Get()
  async check() {
    const services: Record<string, string> = {
      database: 'ok',
      websocket: 'ok',
      email: 'ok',
      storage: 'ok',
    };

    // Check database
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      services.database = 'error';
    }

    // Check Cloudflare R2 storage
    try {
      const s3 = new S3Client({
        region: 'auto',
        endpoint: process.env.R2_ENDPOINT,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      });
      await s3.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET || 'legitas' }));
    } catch {
      services.storage = 'error';
    }

    // Email: check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      services.email = 'error';
    }

    const hasError = Object.values(services).some((s) => s === 'error');
    const status = hasError ? 'degraded' : 'ok';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: '1.0.0',
      services,
    };
  }
}
