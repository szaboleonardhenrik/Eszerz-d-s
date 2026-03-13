import { Injectable, BadRequestException, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const CREDIT_PACKS = [
  { id: 'pack_5', amount: 5, price: 1490, label: '5 kredit' },
  { id: 'pack_15', amount: 15, price: 3990, label: '15 kredit' },
  { id: 'pack_50', amount: 50, price: 9990, label: '50 kredit' },
  { id: 'pack_150', amount: 150, price: 24990, label: '150 kredit' },
] as const;

// Monthly credit grants per tier (given on subscription renewal)
export const TIER_MONTHLY_CREDITS: Record<string, number> = {
  free: 2,
  starter: 15,
  medium: 50,
  premium: 150,
  enterprise: 500,
};

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async getBalance(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { sendCredits: true },
    });
    return user?.sendCredits ?? 0;
  }

  async getHistory(userId: string, page = 1, limit = 20) {
    const [transactions, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contract: { select: { title: true } },
        },
      }),
      this.prisma.creditTransaction.count({ where: { userId } }),
    ]);

    return { transactions, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Deduct 1 credit when sending a contract.
   * Throws if insufficient credits.
   */
  async deductForSend(userId: string, contractId: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { sendCredits: true, subscriptionTier: true, role: true },
      });

      if (!user) throw new BadRequestException('Felhasználó nem található');

      // Admins have unlimited credits
      if (['superadmin', 'employee'].includes(user.role)) return user.sendCredits;

      if (user.sendCredits < 1) {
        throw new BadRequestException(
          'Nincs elég kredited a szerződés kiküldéséhez. Vásárolj kredit csomagot a Beállítások > Számlázás menüben.',
        );
      }

      const newBalance = user.sendCredits - 1;

      await tx.user.update({
        where: { id: userId },
        data: { sendCredits: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount: -1,
          balance: newBalance,
          type: 'usage',
          description: 'Szerződés kiküldése',
          contractId,
        },
      });

      return newBalance;
    });
  }

  /**
   * Purchase a credit pack.
   * TODO: Integrate with Stripe Checkout — create a Checkout Session for the
   * selected pack and only call addCredits() from the Stripe webhook
   * (checkout.session.completed) after successful payment.
   */
  async purchasePack(userId: string, packId: string): Promise<{ balance: number; added: number }> {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) throw new BadRequestException('Érvénytelen kredit csomag');

    // Block direct credit purchase until Stripe payment is integrated
    throw new NotImplementedException(
      'Kredit vásárlás hamarosan elérhető. Stripe fizetési integráció folyamatban.',
    );
  }

  /**
   * Internal method: add credits to a user's account.
   * Used by system processes (monthly tier refills, webhook callbacks, admin grants).
   * This method should NOT be exposed via a public API endpoint.
   */
  async addCredits(userId: string, amount: number, description: string): Promise<{ balance: number; added: number }> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { sendCredits: true },
      });
      if (!user) throw new BadRequestException('Felhasználó nem található');

      const newBalance = user.sendCredits + amount;

      await tx.user.update({
        where: { id: userId },
        data: { sendCredits: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          balance: newBalance,
          type: 'purchase',
          description,
        },
      });

      return { balance: newBalance, added: amount };
    });
  }

  /**
   * Admin: grant credits manually.
   */
  async adminGrant(userId: string, amount: number, description?: string): Promise<number> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { sendCredits: true },
      });
      if (!user) throw new BadRequestException('Felhasználó nem található');

      const newBalance = user.sendCredits + amount;

      await tx.user.update({
        where: { id: userId },
        data: { sendCredits: newBalance },
      });

      await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          balance: newBalance,
          type: 'admin_grant',
          description: description || `Admin jóváírás: ${amount} kredit`,
        },
      });

      return newBalance;
    });
  }
}
