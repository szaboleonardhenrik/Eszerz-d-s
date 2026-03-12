import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Interceptor that logs API usage for requests authenticated via API keys.
 * Only logs when x-api-key-id header is present (set by ApiKeyAuthGuard).
 */
@Injectable()
export class ApiUsageInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const start = Date.now();

    // Only log API key authenticated requests
    const apiKeyId = request.headers['x-api-key-id'];
    const userId = request.user?.userId;
    if (!userId) return next.handle();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          this.logUsage(userId, apiKeyId, request, response.statusCode, Date.now() - start);
        },
        error: (err) => {
          const statusCode = err.status || err.statusCode || 500;
          this.logUsage(userId, apiKeyId, request, statusCode, Date.now() - start);
        },
      }),
    );
  }

  private logUsage(userId: string, apiKeyId: string | undefined, request: any, statusCode: number, responseTimeMs: number) {
    // Fire and forget — don't block the response
    this.prisma.apiUsageLog.create({
      data: {
        userId,
        apiKeyId: apiKeyId || null,
        method: request.method,
        path: request.route?.path || request.url,
        statusCode,
        responseTimeMs,
        ip: request.ip || request.headers['x-forwarded-for'] || null,
        userAgent: request.headers['user-agent'] || null,
      },
    }).catch(() => {});
  }
}
