import { ConsoleLogger, type ConsoleLoggerOptions } from '@nestjs/common';

/**
 * Creates an application logger with environment-appropriate formatting:
 * - Production (NODE_ENV=production): JSON output (structured, machine-readable)
 * - Development (default): Pretty-printed, colorized output
 *
 * Uses NestJS built-in ConsoleLogger options -- no extra dependencies needed.
 */
export function createAppLogger(): ConsoleLogger {
  const isProduction = process.env.NODE_ENV === 'production';

  const options: ConsoleLoggerOptions = isProduction
    ? { json: true, colors: false }
    : { timestamp: true, colors: true };

  return new ConsoleLogger(options);
}
