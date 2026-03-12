/**
 * Sentry error tracking for NestJS backend.
 *
 * Setup:
 * 1. npm install @sentry/node
 * 2. Set SENTRY_DSN in .env
 * 3. Import and call initSentry() at the top of main.ts (before anything else)
 */
let Sentry: any;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    console.log('Sentry: No DSN configured, skipping initialization');
    return;
  }

  try {
    Sentry = require('@sentry/node');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      ignoreErrors: [
        'UnauthorizedException',
        'ForbiddenException',
        'NotFoundException',
        'ThrottlerException',
      ],
    });
    console.log('Sentry: Initialized successfully');
  } catch {
    console.log('Sentry: @sentry/node not installed, skipping');
  }
}

export function captureException(error: Error, context?: Record<string, any>) {
  if (Sentry) {
    if (context) {
      Sentry.withScope((scope: any) => {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
        Sentry.captureException(error);
      });
    } else {
      Sentry.captureException(error);
    }
  }
}
