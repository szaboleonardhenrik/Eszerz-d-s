import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getSystemStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      totalContracts,
      totalQuotes,
      totalSigners,
      contractsToday,
      contractsThisWeek,
      contractsThisMonth,
      statusBreakdown,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.contract.count(),
      this.prisma.quote.count(),
      this.prisma.signer.count(),
      this.prisma.contract.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.contract.count({ where: { createdAt: { gte: weekStart } } }),
      this.prisma.contract.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.contract.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const contractsByStatus: Record<string, number> = {};
    for (const item of statusBreakdown) {
      contractsByStatus[item.status] = item._count.id;
    }

    // Estimate storage: count contracts with PDF URLs
    const contractsWithPdf = await this.prisma.contract.count({
      where: { pdfUrl: { not: null } },
    });
    const estimatedStorageMb = contractsWithPdf * 0.5; // ~500KB per PDF estimate

    return {
      totalUsers,
      totalContracts,
      totalQuotes,
      totalSigners,
      contractsToday,
      contractsThisWeek,
      contractsThisMonth,
      contractsByStatus,
      estimatedStorageMb: Math.round(estimatedStorageMb * 10) / 10,
    };
  }

  async listUsers(page: number, limit: number, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          role: true,
          subscriptionTier: true,
          createdAt: true,
          phone: true,
          _count: {
            select: {
              contracts: true,
              quotes: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Get last login (most recent session) for each user
    const userIds = users.map((u) => u.id);
    const lastSessions = await this.prisma.session.findMany({
      where: { userId: { in: userIds } },
      orderBy: { lastActive: 'desc' },
      distinct: ['userId'],
      select: { userId: true, lastActive: true },
    });

    const lastLoginMap: Record<string, Date> = {};
    for (const s of lastSessions) {
      lastLoginMap[s.userId] = s.lastActive;
    }

    const enrichedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      companyName: u.companyName,
      role: u.role,
      subscriptionTier: u.subscriptionTier,
      createdAt: u.createdAt,
      phone: u.phone,
      contractCount: u._count.contracts,
      quoteCount: u._count.quotes,
      lastLogin: lastLoginMap[u.id] || null,
    }));

    return {
      users: enrichedUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateUser(
    id: string,
    data: { role?: string; subscriptionTier?: string; disabled?: boolean },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Felhasznalo nem talalhato');
    }

    if (data.role && !['owner', 'admin', 'member', 'viewer'].includes(data.role)) {
      throw new BadRequestException('Ervenytelen szerepkor');
    }

    if (
      data.subscriptionTier &&
      !['free', 'basic', 'pro'].includes(data.subscriptionTier)
    ) {
      throw new BadRequestException('Ervenytelen elofizetesi szint');
    }

    const updateData: any = {};
    if (data.role !== undefined) updateData.role = data.role;
    if (data.subscriptionTier !== undefined)
      updateData.subscriptionTier = data.subscriptionTier;

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionTier: true,
      },
    });

    return updated;
  }

  async getRecentActivity(limit: number) {
    const entries = await this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        contract: {
          select: { title: true, ownerId: true, owner: { select: { name: true, email: true } } },
        },
        signer: {
          select: { name: true, email: true },
        },
      },
    });

    return entries.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      eventData: e.eventData ? JSON.parse(e.eventData) : null,
      contractTitle: e.contract?.title || null,
      ownerName: e.contract?.owner?.name || null,
      ownerEmail: e.contract?.owner?.email || null,
      signerName: e.signer?.name || null,
      ipAddress: e.ipAddress,
      createdAt: e.createdAt,
    }));
  }

  async getSubscriptionBreakdown() {
    const breakdown = await this.prisma.user.groupBy({
      by: ['subscriptionTier'],
      _count: { id: true },
    });

    const result: Record<string, number> = { free: 0, basic: 0, pro: 0 };
    for (const item of breakdown) {
      result[item.subscriptionTier] = item._count.id;
    }

    const total = Object.values(result).reduce((a, b) => a + b, 0);

    return { breakdown: result, total };
  }
}
