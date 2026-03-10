import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

interface PortalTokenPayload {
  email: string;
  type: 'portal_access';
}

@Injectable()
export class PortalService {
  private readonly jwtSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {
    this.jwtSecret = this.config.get<string>('JWT_SECRET') ?? 'fallback-secret';
  }

  async requestAccess(email: string): Promise<{ message: string }> {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Ervenytelen email cim');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this email exists as a signer in any contract
    const signerCount = await this.prisma.signer.count({
      where: { email: normalizedEmail },
    });

    // Only generate and send token if email actually exists as a signer
    if (signerCount > 0) {
      const token = jwt.sign(
        { email: normalizedEmail, type: 'portal_access' } as PortalTokenPayload,
        this.jwtSecret,
        { expiresIn: '24h' },
      );

      const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
      const portalUrl = `${frontendUrl}/portal?token=${token}`;

      try {
        await this.notificationsService.sendPortalAccessToken({
          to: normalizedEmail,
          portalUrl,
        });
      } catch {
        // Don't fail — don't reveal whether the email exists
      }
    }

    // Always return the same generic message regardless of whether the email exists
    return {
      message: 'Ha ez az email cim szerepel alairoként, a hozzaferesi linket elkuldtuk emailben. A link 24 oraig ervenyes.',
    };
  }

  async getContracts(token: string) {
    let payload: PortalTokenPayload;

    try {
      payload = jwt.verify(token, this.jwtSecret) as PortalTokenPayload;
    } catch {
      throw new UnauthorizedException('Ervenytelen vagy lejart token. Kerjen uj hozzaferest.');
    }

    if (payload.type !== 'portal_access') {
      throw new UnauthorizedException('Ervenytelen token tipus.');
    }

    const signers = await this.prisma.signer.findMany({
      where: { email: payload.email },
      include: {
        contract: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            verificationHash: true,
            owner: {
              select: {
                name: true,
                companyName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const contracts = signers.map((signer) => ({
      contractId: signer.contract.id,
      title: signer.contract.title,
      contractStatus: signer.contract.status,
      createdAt: signer.contract.createdAt,
      verificationHash: signer.contract.verificationHash,
      ownerName: signer.contract.owner.name,
      ownerCompany: signer.contract.owner.companyName,
      signerStatus: signer.status,
      signedAt: signer.signedAt,
      // signToken intentionally omitted — never expose signing tokens in portal responses
    }));

    return {
      email: payload.email,
      contracts,
    };
  }
}
