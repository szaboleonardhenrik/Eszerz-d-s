import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = config.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET env var is required and must be at least 32 characters');
    }
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.token || null,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: { sub: string; email: string }) {
    // Extract the raw JWT token from the request
    const token = req?.cookies?.token
      || req?.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('A munkamenet érvénytelen.');
    }

    // Hash the token with SHA-256 and verify it exists as a valid, non-expired session
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await this.prisma.session.findFirst({
      where: {
        tokenHash,
        userId: payload.sub,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!session) {
      throw new UnauthorizedException('A munkamenet érvénytelen, visszavonták vagy lejárt.');
    }

    // Update lastActive timestamp (fire-and-forget, don't block the request)
    this.prisma.session.update({
      where: { id: session.id },
      data: { lastActive: new Date() },
    }).catch(() => {});

    // Verify user still exists
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });

    if (!user) {
      throw new UnauthorizedException('A munkamenet érvénytelen vagy a felhasználó már nem létezik.');
    }

    return { userId: payload.sub, email: payload.email };
  }
}
