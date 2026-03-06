import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async createKey(userId: string, name: string, scopes: string) {
    const rawKey = `szp_${randomBytes(32).toString('hex')}`;
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const prefix = rawKey.substring(0, 12);

    const apiKey = await this.prisma.apiKey.create({
      data: { userId, name, keyHash, prefix, scopes },
    });

    return {
      id: apiKey.id,
      name: apiKey.name,
      key: rawKey, // Only returned once!
      prefix: apiKey.prefix,
      scopes: apiKey.scopes,
      createdAt: apiKey.createdAt,
    };
  }

  async listKeys(userId: string) {
    return this.prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        prefix: true,
        scopes: true,
        active: true,
        lastUsed: true,
        expiresAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeKey(userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });
    if (!key) throw new NotFoundException('API kulcs nem található');

    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: { active: false },
    });
  }

  async deleteKey(userId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, userId },
    });
    if (!key) throw new NotFoundException('API kulcs nem található');

    return this.prisma.apiKey.delete({ where: { id: keyId } });
  }

  async validateKey(rawKey: string) {
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyHash },
      include: { user: { select: { id: true, email: true, subscriptionTier: true } } },
    });

    if (!apiKey || !apiKey.active) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    });

    return {
      userId: apiKey.user.id,
      email: apiKey.user.email,
      scopes: apiKey.scopes.split(','),
      tier: apiKey.user.subscriptionTier,
    };
  }
}
