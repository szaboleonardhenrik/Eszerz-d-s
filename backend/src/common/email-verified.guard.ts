import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';

export const REQUIRE_VERIFIED_EMAIL_KEY = 'requireVerifiedEmail';

/**
 * Decorator: apply to controller methods or classes to require verified email.
 * Usage: @RequireVerifiedEmail()
 */
export const RequireVerifiedEmail = () =>
  (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(REQUIRE_VERIFIED_EMAIL_KEY, true, descriptor.value);
    } else {
      Reflect.defineMetadata(REQUIRE_VERIFIED_EMAIL_KEY, true, target);
    }
    return descriptor ?? target;
  };

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required =
      this.reflector.get<boolean>(REQUIRE_VERIFIED_EMAIL_KEY, context.getHandler()) ||
      this.reflector.get<boolean>(REQUIRE_VERIFIED_EMAIL_KEY, context.getClass());

    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId;
    if (!userId) throw new ForbiddenException('Bejelentkezés szükséges');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    });

    if (!user || !user.emailVerified) {
      throw new ForbiddenException(
        'Az e-mail cím megerősítése szükséges a művelet végrehajtásához. Kérjük, ellenőrizze postafiókját.',
      );
    }

    return true;
  }
}
