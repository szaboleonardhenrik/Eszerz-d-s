import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma/prisma.service';

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
  ) {
    this.jwtSecret = this.config.get<string>('JWT_SECRET') ?? 'fallback-secret';
  }

  async requestAccess(email: string): Promise<{ token: string; message: string }> {
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Ervenytelen email cim');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this email exists as a signer in any contract
    const signerCount = await this.prisma.signer.count({
      where: { email: normalizedEmail },
    });

    // Always return success (don't reveal whether email exists for security)
    const token = jwt.sign(
      { email: normalizedEmail, type: 'portal_access' } as PortalTokenPayload,
      this.jwtSecret,
      { expiresIn: '24h' },
    );

    return {
      token,
      message: signerCount > 0
        ? 'Hozzaferes megadva. A token 24 oraig ervenyes.'
        : 'Ha ez az email cim szerepel alairoként, a token 24 oraig ervenyes.',
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
      signToken: signer.status === 'pending' ? signer.signToken : null,
    }));

    return {
      email: payload.email,
      contracts,
    };
  }
}
