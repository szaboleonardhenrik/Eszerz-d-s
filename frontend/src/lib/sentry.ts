/**
 * Sentry error tracking for Next.js frontend.
 *
 * Setup:
 * 1. npm install @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in .env.local
 * 3. This module auto-initializes when imported
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let Sentry: any;
let initialized = false;

function init() {
  if (initialized) return;
  initialized = true;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Sentry = require('@sentry/nextjs');
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
      ignoreErrors: [
        'ResizeObserver loop',
        'Network Error',
        'Request aborted',
        'AbortError',
      ],
    });
  } catch {
    // @sentry/nextjs not installed
  }
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  init();
  if (Sentry) {
    if (context) {
      Sentry.withScope((scope: { setExtra: (key: string, value: unknown) => void }) => {
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

// Auto-init on import
if (typeof window !== 'undefined') {
  init();
}
