import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { InAppNotificationsService } from '../in-app-notifications/in-app-notifications.service';
import { NotificationsService } from '../notifications/notifications.service';
import { clearMaintenanceCache } from '../common/maintenance.middleware';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly inAppNotifications: InAppNotificationsService,
    private readonly notifications: NotificationsService,
  ) {}

  // ── System Stats ──

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

    const contractsWithPdf = await this.prisma.contract.count({
      where: { pdfUrl: { not: null } },
    });
    const estimatedStorageMb = contractsWithPdf * 0.5;

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

  // ── Revenue Dashboard ──

  async getRevenueStats() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Tier pricing (HUF/month estimates)
    const tierPricing: Record<string, number> = {
      free: 0,
      starter: 4990,
      medium: 9990,
      premium: 19990,
      enterprise: 49990,
    };

    const [tierBreakdown, newUsersThisMonth, newUsersPrevMonth, conversions] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['subscriptionTier'],
        _count: { id: true },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
      this.prisma.user.count({ where: { createdAt: { gte: prevMonthStart, lt: monthStart } } }),
      // Users who upgraded from free this month
      this.prisma.user.count({
        where: {
          subscriptionTier: { not: 'free' },
          createdAt: { gte: monthStart },
        },
      }),
    ]);

    let mrr = 0;
    const tierRevenue: Record<string, { count: number; revenue: number }> = {};
    for (const item of tierBreakdown) {
      const price = tierPricing[item.subscriptionTier] || 0;
      const revenue = item._count.id * price;
      mrr += revenue;
      tierRevenue[item.subscriptionTier] = {
        count: item._count.id,
        revenue,
      };
    }

    const totalPaid = Object.entries(tierRevenue)
      .filter(([tier]) => tier !== 'free')
      .reduce((sum, [, v]) => sum + v.count, 0);
    const totalFree = tierRevenue['free']?.count || 0;

    return {
      mrr,
      arr: mrr * 12,
      totalPaid,
      totalFree,
      conversionRate: totalFree + totalPaid > 0
        ? Math.round((totalPaid / (totalFree + totalPaid)) * 1000) / 10
        : 0,
      newUsersThisMonth,
      newUsersPrevMonth,
      userGrowthPct: newUsersPrevMonth > 0
        ? Math.round(((newUsersThisMonth - newUsersPrevMonth) / newUsersPrevMonth) * 100)
        : 100,
      conversionsThisMonth: conversions,
      tierRevenue,
    };
  }

  // ── User Impersonation ──

  async impersonateUser(targetUserId: string, adminUserId: string, adminRole: string) {
    if (adminRole !== 'superadmin') {
      throw new ForbiddenException('Csak szuperadmin használhat imperszonálást');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!targetUser) {
      throw new NotFoundException('Felhasználó nem található');
    }

    // Don't allow impersonating other superadmins
    if (targetUser.role === 'superadmin' && targetUser.id !== adminUserId) {
      throw new ForbiddenException('Más szuperadmin nem imperszonálható');
    }

    // Create a short-lived token (1 hour) for impersonation
    const token = this.jwtService.sign(
      { sub: targetUser.id, email: targetUser.email, impersonatedBy: adminUserId },
      { expiresIn: '1h' },
    );

    // Create a temporary session
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.prisma.session.create({
      data: {
        userId: targetUser.id,
        tokenHash,
        ipAddress: 'impersonation',
        userAgent: `Impersonated by admin ${adminUserId}`,
        device: 'Admin imperszonálás',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    return {
      token,
      user: targetUser,
      expiresIn: 3600,
    };
  }

  // ── API Usage Monitoring ──

  async getApiUsageStats(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const [totalCalls, topUsers, topEndpoints, dailyStats, errorRate] = await Promise.all([
      this.prisma.apiUsageLog.count({ where: { createdAt: { gte: since } } }),

      // Top API consumers
      this.prisma.apiUsageLog.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        _avg: { responseTimeMs: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // Top endpoints
      this.prisma.apiUsageLog.groupBy({
        by: ['method', 'path'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
        _avg: { responseTimeMs: true },
        orderBy: { _count: { id: 'desc' } },
        take: 15,
      }),

      // Daily breakdown (raw query for grouping by date)
      this.prisma.$queryRaw`
        SELECT DATE(created_at) as date, COUNT(*)::int as calls, AVG(response_time_ms)::int as avg_ms
        FROM api_usage_logs
        WHERE created_at >= ${since}
        GROUP BY DATE(created_at)
        ORDER BY date DESC
        LIMIT 30
      ` as Promise<Array<{ date: string; calls: number; avg_ms: number }>>,

      // Error rate
      this.prisma.apiUsageLog.count({
        where: { createdAt: { gte: since }, statusCode: { gte: 400 } },
      }),
    ]);

    // Enrich top users with names
    const userIds = topUsers.map((u) => u.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      totalCalls,
      errorRate: totalCalls > 0 ? Math.round((errorRate / totalCalls) * 1000) / 10 : 0,
      avgResponseMs: 0, // calculated from daily
      topUsers: topUsers.map((u) => ({
        userId: u.userId,
        name: userMap.get(u.userId)?.name || 'Ismeretlen',
        email: userMap.get(u.userId)?.email || '',
        calls: u._count.id,
        avgMs: Math.round(u._avg.responseTimeMs || 0),
      })),
      topEndpoints: topEndpoints.map((e) => ({
        method: e.method,
        path: e.path,
        calls: e._count.id,
        avgMs: Math.round(e._avg.responseTimeMs || 0),
      })),
      dailyStats,
    };
  }

  // ── Email Delivery Log ──

  async getEmailLogs(page: number, limit: number, filters?: { status?: string; type?: string; search?: string }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.search) {
      where.OR = [
        { to: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [logs, total, statusBreakdown] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
      this.prisma.emailLog.count({ where }),
      this.prisma.emailLog.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ]);

    const stats: Record<string, number> = {};
    for (const item of statusBreakdown) {
      stats[item.status] = item._count.id;
    }

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats,
    };
  }

  async resendEmail(emailLogId: string) {
    const log = await this.prisma.emailLog.findUnique({ where: { id: emailLogId } });
    if (!log) throw new NotFoundException('Email napló nem található');
    // Mark as resent — actual resending would require the notifications service
    // This is a stub that returns the log info for frontend to re-trigger
    return { originalLog: log, message: 'Újraküldés indítva' };
  }

  // ── System Broadcasts ──

  async createBroadcast(data: {
    title: string;
    message: string;
    type?: string;
    expiresAt?: string;
  }, adminUserId: string) {
    const broadcast = await this.prisma.systemBroadcast.create({
      data: {
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        createdBy: adminUserId,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    });

    // Send as in-app notification to all users
    const allUsers = await this.prisma.user.findMany({
      select: { id: true },
    });

    // Batch create notifications
    await Promise.all(
      allUsers.map((u) =>
        this.inAppNotifications.create(u.id, {
          type: 'system',
          title: data.title,
          message: data.message,
          link: undefined,
        }),
      ),
    );

    return { broadcast, notifiedUsers: allUsers.length };
  }

  async listBroadcasts() {
    return this.prisma.systemBroadcast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async deleteBroadcast(id: string) {
    const bc = await this.prisma.systemBroadcast.findUnique({ where: { id } });
    if (!bc) throw new NotFoundException('Közlemény nem található');
    await this.prisma.systemBroadcast.update({
      where: { id },
      data: { active: false },
    });
    return { deleted: true };
  }

  async getActiveBroadcasts() {
    return this.prisma.systemBroadcast.findMany({
      where: {
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gte: new Date() } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Existing methods ──

  async listUsers(page: number, limit: number, search?: string, role?: string) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role && ['superadmin', 'employee', 'user'].includes(role)) {
      where.role = role;
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
          sendCredits: true,
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
      sendCredits: u.sendCredits,
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

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: string;
    subscriptionTier?: string;
    companyName?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new BadRequestException('Ez az email cím már regisztrálva van');

    const role = data.role || 'user';
    if (!['superadmin', 'employee', 'user'].includes(role)) {
      throw new BadRequestException('Érvénytelen szerepkör');
    }

    const tier = data.subscriptionTier || 'free';
    if (!['free', 'starter', 'medium', 'premium', 'enterprise'].includes(tier)) {
      throw new BadRequestException('Érvénytelen előfizetési szint');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role,
        subscriptionTier: tier,
        companyName: data.companyName || null,
        emailVerified: true, // Admin-created users are pre-verified
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        subscriptionTier: true,
        companyName: true,
        createdAt: true,
      },
    });

    // Send welcome email with login credentials (fire-and-forget)
    this.notifications.sendAdminWelcomeEmail({
      to: data.email,
      name: data.name,
      password: data.password,
      role,
      tier,
    });

    return user;
  }

  async updateUser(
    id: string,
    data: { role?: string; subscriptionTier?: string },
    requestingUserRole: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Felhasználó nem található');
    }

    if (data.role !== undefined) {
      if (requestingUserRole !== 'superadmin') {
        throw new ForbiddenException('Csak szuperadmin módosíthat szerepkört');
      }
      if (!['superadmin', 'employee', 'user'].includes(data.role)) {
        throw new BadRequestException('Érvénytelen szerepkör');
      }
      if (user.role === 'superadmin' && data.role !== 'superadmin') {
        throw new BadRequestException('Szuperadmin nem fokozható le');
      }
    }

    if (
      data.subscriptionTier &&
      !['free', 'starter', 'medium', 'premium', 'enterprise'].includes(data.subscriptionTier)
    ) {
      throw new BadRequestException('Érvénytelen előfizetési szint');
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

  // ── Authorized Signers CRUD ──

  async listAuthorizedSigners(userId: string) {
    return this.prisma.authorizedSigner.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async createAuthorizedSigner(
    userId: string,
    data: {
      name: string;
      email: string;
      title?: string;
      companyName?: string;
      companyTaxNumber?: string;
      companyAddress?: string;
      isDefault?: boolean;
    },
  ) {
    if (data.isDefault) {
      await this.prisma.authorizedSigner.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.authorizedSigner.create({
      data: { userId, ...data },
    });
  }

  async updateAuthorizedSigner(
    id: string,
    userId: string,
    data: {
      name?: string;
      email?: string;
      title?: string;
      companyName?: string;
      companyTaxNumber?: string;
      companyAddress?: string;
      isDefault?: boolean;
    },
  ) {
    const signer = await this.prisma.authorizedSigner.findFirst({
      where: { id, userId },
    });
    if (!signer) throw new NotFoundException('Aláíró nem található');

    if (data.isDefault) {
      await this.prisma.authorizedSigner.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.authorizedSigner.update({
      where: { id },
      data,
    });
  }

  async deleteAuthorizedSigner(id: string, userId: string) {
    const signer = await this.prisma.authorizedSigner.findFirst({
      where: { id, userId },
    });
    if (!signer) throw new NotFoundException('Aláíró nem található');

    return this.prisma.authorizedSigner.delete({ where: { id } });
  }

  async getSubscriptionBreakdown() {
    const [tierBreakdown, roleBreakdown] = await Promise.all([
      this.prisma.user.groupBy({
        by: ['subscriptionTier'],
        _count: { id: true },
      }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
    ]);

    const tiers: Record<string, number> = {};
    for (const item of tierBreakdown) {
      tiers[item.subscriptionTier] = item._count.id;
    }

    const roles: Record<string, number> = { superadmin: 0, employee: 0, user: 0 };
    for (const item of roleBreakdown) {
      roles[item.role] = item._count.id;
    }

    const total = Object.values(tiers).reduce((a, b) => a + b, 0);

    return { breakdown: tiers, roles, total };
  }

  // ── Promo Codes ──

  async listPromoCodes() {
    return this.prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { usages: true } } },
    });
  }

  async createPromoCode(data: {
    code: string;
    description?: string;
    discountType: string;
    discountValue: number;
    targetTier?: string;
    maxUses?: number;
    validFrom?: string;
    validUntil?: string;
  }, adminUserId: string) {
    const existing = await this.prisma.promoCode.findUnique({ where: { code: data.code.toUpperCase() } });
    if (existing) throw new BadRequestException('Ez a kód már létezik');

    return this.prisma.promoCode.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description || null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        targetTier: data.targetTier || null,
        maxUses: data.maxUses || null,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        createdBy: adminUserId,
      },
    });
  }

  async updatePromoCode(id: string, data: { active?: boolean; maxUses?: number; validUntil?: string }) {
    const code = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!code) throw new NotFoundException('Promóciós kód nem található');
    return this.prisma.promoCode.update({
      where: { id },
      data: {
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.maxUses !== undefined ? { maxUses: data.maxUses } : {}),
        ...(data.validUntil ? { validUntil: new Date(data.validUntil) } : {}),
      },
    });
  }

  async deletePromoCode(id: string) {
    const code = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!code) throw new NotFoundException('Promóciós kód nem található');
    await this.prisma.promoCode.delete({ where: { id } });
    return { deleted: true };
  }

  async validatePromoCode(code: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo || !promo.active) return { valid: false, message: 'Érvénytelen kód' };
    if (promo.maxUses && promo.usedCount >= promo.maxUses) return { valid: false, message: 'A kód elérte a maximális felhasználási számot' };
    if (promo.validFrom && new Date() < promo.validFrom) return { valid: false, message: 'A kód még nem érvényes' };
    if (promo.validUntil && new Date() > promo.validUntil) return { valid: false, message: 'A kód lejárt' };
    return {
      valid: true,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      targetTier: promo.targetTier,
      description: promo.description,
    };
  }

  async applyPromoCode(code: string, userId: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo || !promo.active) throw new BadRequestException('Érvénytelen promóciós kód');
    if (promo.maxUses && promo.usedCount >= promo.maxUses) throw new BadRequestException('A kód elérte a maximális felhasználási számot');
    if (promo.validUntil && new Date() > promo.validUntil) throw new BadRequestException('A kód lejárt');

    // Check if already used by this user
    const existing = await this.prisma.promoCodeUsage.findUnique({
      where: { promoCodeId_userId: { promoCodeId: promo.id, userId } },
    });
    if (existing) throw new BadRequestException('Ezt a kódot már felhasználtad');

    // Apply the promo code
    if (promo.discountType === 'tier_upgrade' && promo.targetTier) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { subscriptionTier: promo.targetTier },
      });
    }

    // Record usage
    await this.prisma.promoCodeUsage.create({
      data: { promoCodeId: promo.id, userId },
    });
    await this.prisma.promoCode.update({
      where: { id: promo.id },
      data: { usedCount: { increment: 1 } },
    });

    return { applied: true, discountType: promo.discountType, discountValue: promo.discountValue, targetTier: promo.targetTier };
  }

  // ── Feature Flags ──

  async listFeatureFlags() {
    return this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
  }

  async updateFeatureFlag(id: string, data: { enabled?: boolean; minTier?: string | null }) {
    const flag = await this.prisma.featureFlag.findUnique({ where: { id } });
    if (!flag) throw new NotFoundException('Feature flag nem található');
    return this.prisma.featureFlag.update({
      where: { id },
      data: {
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        ...(data.minTier !== undefined ? { minTier: data.minTier } : {}),
      },
    });
  }

  async createFeatureFlag(data: { key: string; name: string; description?: string; minTier?: string }) {
    const existing = await this.prisma.featureFlag.findUnique({ where: { key: data.key } });
    if (existing) throw new BadRequestException('Ez a kulcs már létezik');
    return this.prisma.featureFlag.create({ data });
  }

  async getActiveFeatureFlags(userTier: string) {
    const allFlags = await this.prisma.featureFlag.findMany();
    const tierOrder = ['free', 'starter', 'medium', 'premium', 'enterprise'];
    const userTierIdx = tierOrder.indexOf(userTier);

    return allFlags.map((f) => ({
      key: f.key,
      name: f.name,
      enabled: f.enabled && (f.minTier === null || tierOrder.indexOf(f.minTier) <= userTierIdx),
      minTier: f.minTier,
    }));
  }

  // ── Webhook Delivery Logs ──

  async getWebhookDeliveryLogs(page: number, limit: number, webhookId?: string) {
    const where: any = {};
    if (webhookId) where.webhookId = webhookId;

    const [logs, total] = await Promise.all([
      this.prisma.webhookDeliveryLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          webhook: { select: { url: true, userId: true } },
        },
      }),
      this.prisma.webhookDeliveryLog.count({ where }),
    ]);

    return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getWebhookDeliveryStats() {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const [total, successful, failed] = await Promise.all([
      this.prisma.webhookDeliveryLog.count({ where: { createdAt: { gte: since } } }),
      this.prisma.webhookDeliveryLog.count({ where: { createdAt: { gte: since }, success: true } }),
      this.prisma.webhookDeliveryLog.count({ where: { createdAt: { gte: since }, success: false } }),
    ]);

    return { total, successful, failed, successRate: total > 0 ? Math.round((successful / total) * 1000) / 10 : 100 };
  }

  // ── Maintenance Mode ──

  async getMaintenanceStatus() {
    const [modeSetting, messageSetting] = await Promise.all([
      this.prisma.systemSetting.findUnique({ where: { key: 'maintenance_mode' } }),
      this.prisma.systemSetting.findUnique({ where: { key: 'maintenance_message' } }),
    ]);
    return {
      enabled: modeSetting?.value === 'true',
      message: messageSetting?.value || 'A rendszer karbantartás alatt áll.',
    };
  }

  async setMaintenanceMode(enabled: boolean, message?: string) {
    await this.prisma.systemSetting.upsert({
      where: { key: 'maintenance_mode' },
      update: { value: enabled ? 'true' : 'false' },
      create: { key: 'maintenance_mode', value: enabled ? 'true' : 'false' },
    });
    if (message) {
      await this.prisma.systemSetting.upsert({
        where: { key: 'maintenance_message' },
        update: { value: message },
        create: { key: 'maintenance_message', value: message },
      });
    }

    // Clear cache so the middleware picks up the change immediately
    clearMaintenanceCache();

    // If enabling, broadcast to all users
    if (enabled) {
      const allUsers = await this.prisma.user.findMany({ select: { id: true } });
      await Promise.all(
        allUsers.map((u) =>
          this.inAppNotifications.create(u.id, {
            type: 'system',
            title: 'Karbantartás',
            message: message || 'A rendszer karbantartás alatt áll. Kérjük, próbálja újra később.',
          }),
        ),
      );
    }

    return { enabled, message };
  }

  // ── Invoice Admin ──

  async listAllInvoices(page: number, limit: number, status?: string) {
    const where: any = {};
    if (status) where.status = status;

    const [invoices, total, statusBreakdown] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { name: true, email: true, companyName: true } } },
      }),
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true },
      }),
    ]);

    const stats: Record<string, { count: number; total: number }> = {};
    for (const item of statusBreakdown) {
      stats[item.status] = { count: item._count.id, total: item._sum.amount || 0 };
    }

    return { invoices, total, page, limit, totalPages: Math.ceil(total / limit), stats };
  }
}
