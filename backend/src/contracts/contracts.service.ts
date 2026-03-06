import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService, PdfBranding } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TemplatesService } from '../templates/templates.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfService: PdfService,
    private readonly storageService: StorageService,
    private readonly auditService: AuditService,
    private readonly notificationsService: NotificationsService,
    private readonly templatesService: TemplatesService,
    private readonly config: ConfigService,
  ) {}

  private getUserBranding(user: any): PdfBranding | undefined {
    if (!user?.brandLogoUrl && !user?.brandColor && !user?.companyName) return undefined;
    return {
      logoUrl: user.brandLogoUrl ?? undefined,
      companyName: user.companyName ?? undefined,
      brandColor: user.brandColor ?? undefined,
    };
  }

  async create(dto: CreateContractDto, userId: string) {
    // Subscription limit check
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const tier = user?.subscriptionTier ?? 'free';

    if (tier !== 'pro') {
      const maxContracts = tier === 'basic' ? 30 : 5;
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);

      const monthlyCount = await this.prisma.contract.count({
        where: { ownerId: userId, createdAt: { gte: firstOfMonth } },
      });

      if (monthlyCount >= maxContracts) {
        throw new ForbiddenException(
          'Elérted a havi szerződés limitedet. Válts magasabb csomagra!',
        );
      }
    }

    let contentHtml: string;

    if (dto.templateId && dto.variables) {
      contentHtml = await this.templatesService.renderTemplate(
        dto.templateId,
        dto.variables,
      );
    } else if (dto.contentHtml) {
      contentHtml = dto.contentHtml;
    } else {
      throw new BadRequestException(
        'Adj meg sablont és változókat, vagy egyedi HTML tartalmat',
      );
    }

    const branding = this.getUserBranding(user);
    const pdfBuffer = await this.pdfService.generatePdf(contentHtml, dto.title, branding);
    const pdfKey = `contracts/${userId}/${randomUUID()}.pdf`;
    await this.storageService.uploadPdf(pdfKey, pdfBuffer);
    const documentHash = this.pdfService.hashDocument(pdfBuffer);

    const contract = await this.prisma.contract.create({
      data: {
        title: dto.title,
        templateId: dto.templateId,
        ownerId: userId,
        contentHtml,
        pdfUrl: pdfKey,
        variablesData: dto.variables ? JSON.stringify(dto.variables) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        signers: {
          create: dto.signers.map((s, i) => ({
            name: s.name,
            email: s.email,
            role: s.role,
            signingOrder: s.signingOrder ?? i + 1,
            signToken: randomUUID(),
            tokenExpiresAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000,
            ),
          })),
        },
        versions: {
          create: {
            version: 1,
            contentHtml,
            pdfUrl: pdfKey,
            changeNote: 'Eredeti verzió',
            createdBy: userId,
          },
        },
      },
      include: { signers: true },
    });

    await this.auditService.log({
      contractId: contract.id,
      eventType: 'contract_created',
      eventData: { title: dto.title, signerCount: dto.signers.length },
      documentHash,
    });

    return contract;
  }

  async updateContent(contractId: string, userId: string, contentHtml: string, changeNote?: string) {
    const contract = await this.findOneOwned(contractId, userId);

    if (contract.status !== 'draft') {
      throw new BadRequestException('Csak piszkozat státuszú szerződés szerkeszthető');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const branding = this.getUserBranding(user);
    const pdfBuffer = await this.pdfService.generatePdf(contentHtml, contract.title, branding);
    const pdfKey = `contracts/${userId}/${randomUUID()}.pdf`;
    await this.storageService.uploadPdf(pdfKey, pdfBuffer);

    const lastVersion = await this.prisma.contractVersion.findFirst({
      where: { contractId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    await this.prisma.contractVersion.create({
      data: {
        contractId,
        version: nextVersion,
        contentHtml,
        pdfUrl: pdfKey,
        changeNote: changeNote ?? `${nextVersion}. verzió`,
        createdBy: userId,
      },
    });

    const updated = await this.prisma.contract.update({
      where: { id: contractId },
      data: { contentHtml, pdfUrl: pdfKey },
      include: { signers: true },
    });

    await this.auditService.log({
      contractId,
      eventType: 'contract_updated',
      eventData: { version: nextVersion, changeNote },
    });

    return updated;
  }

  async getVersions(contractId: string, userId: string) {
    await this.findOneOwned(contractId, userId);
    return this.prisma.contractVersion.findMany({
      where: { contractId },
      orderBy: { version: 'desc' },
    });
  }

  async sendReminder(contractId: string, signerId: string, userId: string) {
    const contract = await this.findOneOwned(contractId, userId);
    if (!['sent', 'partially_signed'].includes(contract.status)) {
      throw new BadRequestException('Emlékeztető csak elküldött szerződéshez küldhető');
    }

    const signer = contract.signers.find((s) => s.id === signerId);
    if (!signer) throw new NotFoundException('Aláíró nem található');
    if (signer.status !== 'pending') {
      throw new BadRequestException('Ez az aláíró már aláírta vagy visszautasította');
    }

    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    await this.notificationsService.sendReminder({
      to: signer.email,
      signerName: signer.name,
      contractTitle: contract.title,
      signUrl: `${frontendUrl}/sign/${signer.signToken}`,
      expiresAt: signer.tokenExpiresAt?.toLocaleDateString('hu-HU') ?? '',
    });

    await this.auditService.log({
      contractId,
      signerId: signer.id,
      eventType: 'reminder_sent',
      eventData: { email: signer.email },
    });

    return { message: `Emlékeztető elküldve: ${signer.name}` };
  }

  async sendForSigning(contractId: string, userId: string) {
    const contract = await this.findOneOwned(contractId, userId);

    if (contract.status !== 'draft') {
      throw new BadRequestException('Csak piszkozat státuszú szerződés küldhető el');
    }

    const owner = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    for (const signer of contract.signers) {
      const signUrl = `${frontendUrl}/sign/${signer.signToken}`;
      await this.notificationsService.sendSigningInvitation({
        to: signer.email,
        signerName: signer.name,
        senderName: owner?.name ?? 'Ismeretlen',
        contractTitle: contract.title,
        signUrl,
        expiresAt: signer.tokenExpiresAt?.toLocaleDateString('hu-HU') ?? '',
      });

      await this.auditService.log({
        contractId: contract.id,
        signerId: signer.id,
        eventType: 'email_sent',
        eventData: { email: signer.email },
      });
    }

    await this.prisma.contract.update({
      where: { id: contractId },
      data: { status: 'sent' },
    });

    return { message: 'Szerződés elküldve aláírásra' };
  }

  async findAllByUser(
    userId: string,
    status?: string,
    search?: string,
    tagId?: string,
    page: number = 1,
    limit: number = 20,
    folderId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const where: any = { ownerId: userId };
    if (status) where.status = status;
    if (tagId) {
      where.tags = { some: { tagId } };
    }
    if (folderId === 'none') {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contentHtml: { contains: search, mode: 'insensitive' } },
        { signers: { some: { name: { contains: search, mode: 'insensitive' } } } },
        { signers: { some: { email: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        include: {
          signers: { select: { id: true, name: true, email: true, status: true, role: true } },
          template: { select: { name: true, category: true } },
          tags: { include: { tag: true } },
          folder: { select: { id: true, name: true, color: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.contract.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOneOwned(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { signers: true },
    });

    if (!contract) {
      throw new NotFoundException('A szerződés nem található');
    }
    if (contract.ownerId !== userId) {
      throw new ForbiddenException('Nincs jogosultságod ehhez a szerződéshez');
    }
    return contract;
  }

  async findOneWithDetails(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        signers: true,
        template: { select: { name: true, category: true } },
        tags: { include: { tag: true } },
      },
    });

    if (!contract) throw new NotFoundException('A szerződés nem található');
    if (contract.ownerId !== userId)
      throw new ForbiddenException('Nincs jogosultságod');

    const auditLogs = await this.auditService.getByContract(contractId);
    return { ...contract, auditLogs };
  }

  async getDownloadUrl(contractId: string, userId: string) {
    const contract = await this.findOneOwned(contractId, userId);
    if (!contract.pdfUrl) {
      throw new NotFoundException('Nincs PDF ehhez a szerződéshez');
    }
    const url = await this.storageService.getSignedDownloadUrl(contract.pdfUrl);
    return { url };
  }

  async cancel(contractId: string, userId: string) {
    const contract = await this.findOneOwned(contractId, userId);
    if (contract.status === 'completed') {
      throw new BadRequestException('Teljesített szerződés nem vonható vissza');
    }
    await this.prisma.contract.update({
      where: { id: contractId },
      data: { status: 'cancelled' },
    });
    await this.auditService.log({
      contractId,
      eventType: 'expired',
      eventData: { reason: 'cancelled_by_owner' },
    });
    return { message: 'Szerződés visszavonva' };
  }

  async exportContracts(userId: string, status?: string) {
    const where: any = { ownerId: userId };
    if (status) where.status = status;

    return this.prisma.contract.findMany({
      where,
      include: {
        signers: { select: { name: true, email: true } },
        template: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async duplicate(contractId: string, userId: string) {
    const original = await this.findOneOwned(contractId, userId);

    const newContract = await this.prisma.contract.create({
      data: {
        title: `${original.title} (másolat)`,
        templateId: original.templateId,
        ownerId: userId,
        contentHtml: original.contentHtml,
        variablesData: original.variablesData,
        status: 'draft',
        signers: {
          create: original.signers.map((s) => ({
            name: s.name,
            email: s.email,
            role: s.role,
            signingOrder: s.signingOrder,
            signToken: randomUUID(),
            tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            status: 'pending',
          })),
        },
      },
      include: { signers: true },
    });

    await this.auditService.log({
      contractId: newContract.id,
      eventType: 'contract_duplicated',
      eventData: { originalContractId: contractId, title: newContract.title },
    });

    return newContract;
  }

  async bulkSend(contractIds: string[], userId: string) {
    let successCount = 0;
    let failureCount = 0;
    const errors: { contractId: string; error: string }[] = [];

    for (const contractId of contractIds) {
      try {
        await this.sendForSigning(contractId, userId);
        successCount++;
      } catch (err: any) {
        failureCount++;
        errors.push({ contractId, error: err.message ?? 'Ismeretlen hiba' });
      }
    }

    return { successCount, failureCount, errors };
  }

  async getDashboardWidgets(userId: string) {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Expiring contracts (within 7 days)
    const expiringContracts = await this.prisma.contract.findMany({
      where: {
        ownerId: userId,
        status: { in: ['sent', 'partially_signed'] },
        expiresAt: { gte: now, lte: sevenDaysLater },
      },
      include: { signers: { select: { name: true, status: true } } },
      orderBy: { expiresAt: 'asc' },
      take: 5,
    });

    // Contracts with pending signers (waiting longest)
    const awaitingSignature = await this.prisma.contract.findMany({
      where: {
        ownerId: userId,
        status: { in: ['sent', 'partially_signed'] },
      },
      include: {
        signers: {
          where: { status: 'pending' },
          select: { name: true, email: true, createdAt: true },
        },
      },
      orderBy: { updatedAt: 'asc' },
      take: 5,
    });

    // Recently completed
    const recentlyCompleted = await this.prisma.contract.findMany({
      where: { ownerId: userId, status: 'completed' },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    return {
      expiringContracts: expiringContracts.map((c) => ({
        id: c.id,
        title: c.title,
        expiresAt: c.expiresAt,
        pendingSigners: c.signers.filter((s) => s.status === 'pending').length,
        totalSigners: c.signers.length,
      })),
      awaitingSignature: awaitingSignature
        .filter((c) => c.signers.length > 0)
        .map((c) => ({
          id: c.id,
          title: c.title,
          pendingSigners: c.signers.map((s) => s.name),
          waitingSince: c.updatedAt,
        })),
      recentlyCompleted,
    };
  }

  async getAnalytics(userId: string) {
    // Overview stats
    const allContracts = await this.prisma.contract.findMany({
      where: { ownerId: userId },
      include: {
        signers: true,
        template: { select: { id: true, name: true } },
      },
    });

    const total = allContracts.length;
    const completedCount = allContracts.filter(
      (c) => c.status === 'completed',
    ).length;
    const expiredCount = allContracts.filter(
      (c) => c.status === 'expired',
    ).length;
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    const expirationRate = total > 0 ? Math.round((expiredCount / total) * 100) : 0;

    // Average signing time (days)
    const completedContracts = allContracts.filter(
      (c) => c.status === 'completed',
    );
    let avgSigningTime = 0;
    if (completedContracts.length > 0) {
      const totalDays = completedContracts.reduce((sum, c) => {
        const diff =
          (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0);
      avgSigningTime = Math.round((totalDays / completedContracts.length) * 10) / 10;
    }

    const totalSigners = allContracts.reduce(
      (sum, c) => sum + c.signers.length,
      0,
    );

    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const activeThisMonth = allContracts.filter(
      (c) => new Date(c.createdAt) >= firstOfMonth,
    ).length;

    const overview = {
      total,
      completionRate,
      avgSigningTime,
      totalSigners,
      activeThisMonth,
    };

    // Status breakdown
    const statusMap: Record<string, number> = {};
    for (const c of allContracts) {
      statusMap[c.status] = (statusMap[c.status] || 0) + 1;
    }
    const statusBreakdown = Object.entries(statusMap).map(
      ([status, count]) => ({ status, count }),
    );

    // Monthly trend (last 12 months)
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const created = allContracts.filter(
        (c) => new Date(c.createdAt) >= start && new Date(c.createdAt) < end,
      ).length;
      const completed = allContracts.filter(
        (c) =>
          c.status === 'completed' &&
          new Date(c.updatedAt) >= start &&
          new Date(c.updatedAt) < end,
      ).length;

      monthlyTrend.push({
        month: start.toLocaleDateString('hu-HU', {
          year: 'numeric',
          month: 'short',
        }),
        created,
        completed,
      });
    }

    // Top 5 templates
    const templateCounts: Record<string, { name: string; count: number }> = {};
    for (const c of allContracts) {
      if (c.template) {
        if (!templateCounts[c.template.id]) {
          templateCounts[c.template.id] = { name: c.template.name, count: 0 };
        }
        templateCounts[c.template.id].count++;
      }
    }
    const topTemplates = Object.values(templateCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Signer stats
    const allSigners = allContracts.flatMap((c) => c.signers);
    const avgSignersPerContract =
      total > 0
        ? Math.round((allSigners.length / total) * 10) / 10
        : 0;

    let fastestSigner: { name: string; email: string; days: number } | null =
      null;
    for (const c of allContracts) {
      for (const s of c.signers) {
        if (s.signedAt) {
          const days =
            (new Date(s.signedAt).getTime() -
              new Date(c.createdAt).getTime()) /
            (1000 * 60 * 60 * 24);
          if (!fastestSigner || days < fastestSigner.days) {
            fastestSigner = {
              name: s.name,
              email: s.email,
              days: Math.round(days * 10) / 10,
            };
          }
        }
      }
    }

    const signerEmailCounts: Record<string, number> = {};
    for (const s of allSigners) {
      signerEmailCounts[s.email] = (signerEmailCounts[s.email] || 0) + 1;
    }
    const mostActiveSigner = Object.entries(signerEmailCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];

    const signerStats = {
      avgSignersPerContract,
      fastestSigner,
      mostActiveSigner: mostActiveSigner
        ? { email: mostActiveSigner[0], count: mostActiveSigner[1] }
        : null,
    };

    return {
      overview,
      statusBreakdown,
      monthlyTrend,
      topTemplates,
      signerStats,
      expirationRate,
    };
  }

  async getDashboardStats(userId: string) {
    const [total, draft, sent, partiallySigned, completed, declined, expired] =
      await Promise.all([
        this.prisma.contract.count({ where: { ownerId: userId } }),
        this.prisma.contract.count({ where: { ownerId: userId, status: 'draft' } }),
        this.prisma.contract.count({ where: { ownerId: userId, status: 'sent' } }),
        this.prisma.contract.count({ where: { ownerId: userId, status: 'partially_signed' } }),
        this.prisma.contract.count({ where: { ownerId: userId, status: 'completed' } }),
        this.prisma.contract.count({ where: { ownerId: userId, status: 'declined' } }),
        this.prisma.contract.count({ where: { ownerId: userId, status: 'expired' } }),
      ]);

    // Monthly stats for charts (last 6 months)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date();
      start.setMonth(start.getMonth() - i, 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const [created, signed] = await Promise.all([
        this.prisma.contract.count({
          where: { ownerId: userId, createdAt: { gte: start, lt: end } },
        }),
        this.prisma.contract.count({
          where: { ownerId: userId, status: 'completed', updatedAt: { gte: start, lt: end } },
        }),
      ]);

      monthlyStats.push({
        month: start.toLocaleDateString('hu-HU', { year: 'numeric', month: 'short' }),
        created,
        signed,
      });
    }

    // Subscription usage
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const tier = user?.subscriptionTier ?? 'free';
    const firstOfMonth = new Date();
    firstOfMonth.setDate(1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const monthlyUsage = await this.prisma.contract.count({
      where: { ownerId: userId, createdAt: { gte: firstOfMonth } },
    });
    const monthlyLimit = tier === 'pro' ? -1 : tier === 'basic' ? 30 : 5;

    return {
      total,
      draft,
      awaitingSignature: sent + partiallySigned,
      completed,
      declined,
      expired,
      monthlyStats,
      usage: { used: monthlyUsage, limit: monthlyLimit, tier },
    };
  }
}
