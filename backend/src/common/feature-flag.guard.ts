import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

export const FEATURE_FLAG_KEY = 'requiredFeature';

export const RequireFeature = (featureKey: string) =>
  (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(FEATURE_FLAG_KEY, featureKey, descriptor.value);
    } else {
      Reflect.defineMetadata(FEATURE_FLAG_KEY, featureKey, target);
    }
    return descriptor ?? target;
  };

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check method-level first, then class-level
    const featureKey =
      this.reflector.get<string>(FEATURE_FLAG_KEY, context.getHandler()) ||
      this.reflector.get<string>(FEATURE_FLAG_KEY, context.getClass());

    if (!featureKey) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) throw new ForbiddenException('Bejelentkezés szükséges');

    const [flag, user] = await Promise.all([
      this.prisma.featureFlag.findUnique({ where: { key: featureKey } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true, role: true },
      }),
    ]);

    // If flag doesn't exist or is disabled globally
    if (!flag || !flag.enabled) {
      throw new ForbiddenException('Ez a funkció jelenleg nem elérhető');
    }

    // Admins bypass tier checks
    if (user && ['superadmin', 'employee'].includes(user.role)) {
      return true;
    }

    // Check tier requirement
    if (flag.minTier && user) {
      const tierOrder = ['free', 'starter', 'medium', 'premium', 'enterprise'];
      const userTierIdx = tierOrder.indexOf(user.subscriptionTier);
      const requiredIdx = tierOrder.indexOf(flag.minTier);
      if (userTierIdx < requiredIdx) {
        throw new ForbiddenException(
          `Ez a funkció a(z) ${flag.minTier} csomag része. Kérjük, frissítsd az előfizetésed.`,
        );
      }
    }

    return true;
  }
}
