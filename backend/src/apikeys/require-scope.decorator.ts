import { SetMetadata } from '@nestjs/common';

export const REQUIRED_SCOPES_KEY = 'requiredScopes';

/**
 * Decorator to require specific API key scopes on a controller method.
 * Used together with ApiKeyGuard or ApiKeyOrJwtGuard.
 * JWT-authenticated requests bypass scope checks.
 *
 * @example @RequireScopes('contracts:read')
 * @example @RequireScopes('contracts:read', 'contracts:write')
 */
export const RequireScopes = (...scopes: string[]) =>
  SetMetadata(REQUIRED_SCOPES_KEY, scopes);
