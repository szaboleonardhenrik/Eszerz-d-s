import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

export const ADMIN_ROLES = ['superadmin', 'employee'];

/**
 * Guard that allows access for superadmin and employee roles.
 * Use @SuperAdminOnly() decorator to restrict to superadmin only.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;

    if (!userId) {
      throw new ForbiddenException('Nincs bejelentkezve');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new ForbiddenException('Felhasználó nem található');
    }

    // Check if route requires superadmin only
    const superAdminOnly = this.reflector.get<boolean>(
      'superAdminOnly',
      context.getHandler(),
    );

    if (superAdminOnly) {
      if (user.role !== 'superadmin') {
        throw new ForbiddenException('Szuperadmin jogosultság szükséges');
      }
      return true;
    }

    // Default: allow superadmin and employee
    if (!ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenException('Admin jogosultság szükséges');
    }

    // Attach role to request for downstream use
    request.userRole = user.role;

    return true;
  }
}
