import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    dto: {
      contractId: string;
      type: string;
      message: string;
      remindAt: string;
    },
  ) {
    // Verify ownership
    const contract = await this.prisma.contract.findUnique({
      where: { id: dto.contractId },
    });
    if (!contract) throw new NotFoundException('Szerzodes nem talalhato');
    if (contract.ownerId !== userId)
      throw new ForbiddenException('Nincs jogosultsagod ehhez a szerzdeshez');

    return this.prisma.contractReminder.create({
      data: {
        contractId: dto.contractId,
        type: dto.type,
        message: dto.message,
        remindAt: new Date(dto.remindAt),
      },
      include: {
        contract: { select: { id: true, title: true } },
      },
    });
  }

  async listByContract(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });
    if (!contract) throw new NotFoundException('Szerzodes nem talalhato');
    if (contract.ownerId !== userId)
      throw new ForbiddenException('Nincs jogosultsagod');

    return this.prisma.contractReminder.findMany({
      where: { contractId },
      orderBy: { remindAt: 'asc' },
    });
  }

  async delete(reminderId: string, userId: string) {
    const reminder = await this.prisma.contractReminder.findUnique({
      where: { id: reminderId },
      include: { contract: { select: { ownerId: true } } },
    });
    if (!reminder) throw new NotFoundException('Emlekezeto nem talalhato');
    if (reminder.contract.ownerId !== userId)
      throw new ForbiddenException('Nincs jogosultsagod');

    await this.prisma.contractReminder.delete({
      where: { id: reminderId },
    });
    return { message: 'Emlekezeto torolve' };
  }

  async getUpcomingReminders(userId: string) {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    return this.prisma.contractReminder.findMany({
      where: {
        contract: { ownerId: userId },
        sent: false,
        remindAt: { gte: now, lte: sevenDaysLater },
      },
      include: {
        contract: { select: { id: true, title: true, status: true } },
      },
      orderBy: { remindAt: 'asc' },
    });
  }

  async getDashboardAlerts(userId: string) {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Contracts expiring within 7 days
    const expiringIn7Days = await this.prisma.contract.findMany({
      where: {
        ownerId: userId,
        status: { in: ['sent', 'partially_signed', 'draft'] },
        expiresAt: { gte: now, lte: sevenDaysLater },
      },
      select: {
        id: true,
        title: true,
        status: true,
        expiresAt: true,
      },
      orderBy: { expiresAt: 'asc' },
    });

    // Contracts expiring within 30 days (but not in the 7-day set)
    const expiringIn30Days = await this.prisma.contract.findMany({
      where: {
        ownerId: userId,
        status: { in: ['sent', 'partially_signed', 'draft'] },
        expiresAt: { gt: sevenDaysLater, lte: thirtyDaysLater },
      },
      select: {
        id: true,
        title: true,
        status: true,
        expiresAt: true,
      },
      orderBy: { expiresAt: 'asc' },
    });

    // Unsigned contracts older than 3 days
    const staleUnsigned = await this.prisma.contract.findMany({
      where: {
        ownerId: userId,
        status: { in: ['sent', 'partially_signed'] },
        createdAt: { lte: threeDaysAgo },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        signers: {
          where: { status: 'pending' },
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    return {
      expiringIn7Days: expiringIn7Days.map((c) => ({
        ...c,
        daysUntilExpiry: Math.ceil(
          (new Date(c.expiresAt!).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      })),
      expiringIn30Days: expiringIn30Days.map((c) => ({
        ...c,
        daysUntilExpiry: Math.ceil(
          (new Date(c.expiresAt!).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      })),
      staleUnsigned: staleUnsigned.map((c) => ({
        ...c,
        daysSinceCreated: Math.floor(
          (now.getTime() - new Date(c.createdAt).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      })),
      totalAlerts:
        expiringIn7Days.length +
        expiringIn30Days.length +
        staleUnsigned.length,
    };
  }
}
