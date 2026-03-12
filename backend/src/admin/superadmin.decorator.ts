import { SetMetadata } from '@nestjs/common';

/**
 * Restrict an admin endpoint to superadmin only.
 * Must be used together with AdminGuard.
 */
export const SuperAdminOnly = () => SetMetadata('superAdminOnly', true);
