import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

// Cache maintenance status for 10 seconds to avoid DB hit on every request
let cachedStatus: { enabled: boolean; message: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10_000;

// Paths that should never be blocked by maintenance mode
const BYPASS_PATHS = [
  '/api/admin/',       // Admin endpoints (so admins can toggle it off)
  '/api/auth/',        // Auth (so admins can log in)
  '/api/health',       // Health check
  '/api/feature-flags', // Feature flags
];

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.jwtSecret = this.config.get<string>('JWT_SECRET') || '';
  }

  async use(req: any, res: any, next: () => void) {
    const path: string = req.originalUrl || req.url || '';

    // Bypass for whitelisted paths
    if (BYPASS_PATHS.some((p) => path.startsWith(p))) {
      return next();
    }

    const status = await this.getMaintenanceStatus();
    if (!status.enabled) {
      return next();
    }

    // Try to identify admin/employee users from JWT (auth guard hasn't run yet)
    const userId = this.extractUserIdFromToken(req);
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });
      if (user && ['superadmin', 'employee'].includes(user.role)) {
        return next();
      }
    }

    res.status(503).json({
      success: false,
      error: {
        code: 'MAINTENANCE',
        message: status.message,
      },
      meta: { timestamp: new Date().toISOString(), version: '1.0' },
    });
  }

  private extractUserIdFromToken(req: any): string | null {
    try {
      const token = req.cookies?.token
        || req.headers?.authorization?.replace('Bearer ', '');
      if (!token || !this.jwtSecret) return null;
      const payload = jwt.verify(token, this.jwtSecret) as any;
      return payload.sub || null;
    } catch {
      return null;
    }
  }

  private async getMaintenanceStatus(): Promise<{ enabled: boolean; message: string }> {
    const now = Date.now();
    if (cachedStatus && now - cachedStatus.fetchedAt < CACHE_TTL_MS) {
      return cachedStatus;
    }

    const [modeSetting, messageSetting] = await Promise.all([
      this.prisma.systemSetting.findUnique({ where: { key: 'maintenance_mode' } }),
      this.prisma.systemSetting.findUnique({ where: { key: 'maintenance_message' } }),
    ]);

    cachedStatus = {
      enabled: modeSetting?.value === 'true',
      message: messageSetting?.value || 'A rendszer karbantartás alatt áll. Kérjük, próbálja újra később.',
      fetchedAt: now,
    };

    return cachedStatus;
  }
}

// Export a function to clear cache when maintenance mode is toggled
export function clearMaintenanceCache() {
  cachedStatus = null;
}
