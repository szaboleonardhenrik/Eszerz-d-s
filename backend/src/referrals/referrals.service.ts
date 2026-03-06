import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCode(): string {
    return randomBytes(4).toString('hex').slice(0, 8).toUpperCase();
  }

  async getOrCreateCode(userId: string) {
    const existing = await this.prisma.referral.findFirst({
      where: { referrerId: userId, referredId: null },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.referral.create({
      data: {
        referrerId: userId,
        referralCode: this.generateCode(),
      },
    });
  }

  async getMyReferrals(userId: string) {
    return this.prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        referred: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async getStats(userId: string) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
    });

    const totalInvites = referrals.length;
    const converted = referrals.filter((r) => r.referredId !== null).length;
    const pending = totalInvites - converted;
    const bonusContracts = referrals.filter((r) => r.bonusApplied).length * 5;

    return { totalInvites, converted, pending, bonusContracts };
  }

  async applyReferral(referralCode: string, newUserId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { referralCode },
    });

    if (!referral) {
      throw new NotFoundException('Referral code not found');
    }

    if (referral.referredId) {
      throw new BadRequestException('Referral code already used');
    }

    if (referral.referrerId === newUserId) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    const updated = await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        referredId: newUserId,
        convertedAt: new Date(),
        bonusApplied: true,
      },
    });

    // Log bonus contracts for both users (no actual tier change)
    console.log(
      `[Referral] +5 bonus contracts for referrer ${referral.referrerId} (referral ${referral.id})`,
    );
    console.log(
      `[Referral] +5 bonus contracts for referred ${newUserId} (referral ${referral.id})`,
    );

    return updated;
  }

  async validateCode(code: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { referralCode: code },
      include: {
        referrer: {
          select: { id: true, name: true },
        },
      },
    });

    if (!referral || referral.referredId) {
      return { valid: false, referrerName: null };
    }

    return { valid: true, referrerName: referral.referrer?.name ?? null };
  }
}
