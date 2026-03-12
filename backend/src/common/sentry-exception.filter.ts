import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { captureException } from '../sentry';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Only capture 500+ errors to Sentry (not 4xx client errors)
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= 500) {
      const ctx = host.switchToHttp();
      const request = ctx.getRequest();
      captureException(exception as Error, {
        url: request?.url,
        method: request?.method,
        userId: request?.user?.userId,
        statusCode: status,
      });
    }

    super.catch(exception, host);
  }
}
