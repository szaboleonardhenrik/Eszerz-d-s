import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartnerDto, UpdatePartnerDto } from './dto';
import * as cheerio from 'cheerio';

interface JobSearchResult {
  title: string;
  link: string;
  snippet: string;
}

@Injectable()
export class PartnerMonitorService {
  private readonly logger = new Logger(PartnerMonitorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ─── PARTNER CRUD ────────────────────────────────────────

  async createPartner(userId: string, dto: CreatePartnerDto) {
    const existing = await this.prisma.partner.findUnique({
      where: { userId_companyName: { userId, companyName: dto.companyName } },
    });
    if (existing) {
      throw new ConflictException(`Partner "${dto.companyName}" már létezik`);
    }
    return this.prisma.partner.create({
      data: { userId, ...dto },
    });
  }

  async bulkCreatePartners(userId: string, partners: CreatePartnerDto[]) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };
    for (const dto of partners) {
      try {
        await this.createPartner(userId, dto);
        results.created++;
      } catch (e: any) {
        if (e instanceof ConflictException) {
          results.skipped++;
        } else {
          results.errors.push(`${dto.companyName}: ${e.message}`);
        }
      }
    }
    return results;
  }

  async getPartners(userId: string, options?: { isActive?: boolean; search?: string }) {
    const where: any = { userId };
    if (options?.isActive !== undefined) where.isActive = options.isActive;
    if (options?.search) {
      where.companyName = { contains: options.search, mode: 'insensitive' };
    }

    return this.prisma.partner.findMany({
      where,
      include: {
        jobListings: {
          where: { status: 'active' },
          orderBy: { firstSeenAt: 'desc' },
          take: 5,
        },
        _count: { select: { jobListings: true } },
      },
      orderBy: { companyName: 'asc' },
    });
  }

  async getPartner(userId: string, partnerId: string) {
    const partner = await this.prisma.partner.findFirst({
      where: { id: partnerId, userId },
      include: {
        jobListings: { orderBy: { firstSeenAt: 'desc' } },
        _count: { select: { jobListings: true } },
      },
    });
    if (!partner) throw new NotFoundException('Partner nem található');
    return partner;
  }

  async updatePartner(userId: string, partnerId: string, dto: UpdatePartnerDto) {
    const partner = await this.prisma.partner.findFirst({
      where: { id: partnerId, userId },
    });
    if (!partner) throw new NotFoundException('Partner nem található');

    return this.prisma.partner.update({
      where: { id: partnerId },
      data: dto,
    });
  }

  async deletePartner(userId: string, partnerId: string) {
    const partner = await this.prisma.partner.findFirst({
      where: { id: partnerId, userId },
    });
    if (!partner) throw new NotFoundException('Partner nem található');

    await this.prisma.partner.delete({ where: { id: partnerId } });
    return { deleted: true };
  }

  // ─── DASHBOARD / STATS ──────────────────────────────────

  async getDashboard(userId: string) {
    const [totalPartners, activePartners, recentListings, newToday, lastRun] = await Promise.all([
      this.prisma.partner.count({ where: { userId } }),
      this.prisma.partner.count({ where: { userId, isActive: true } }),
      this.prisma.jobListing.findMany({
        where: { partner: { userId }, status: 'active' },
        include: { partner: { select: { companyName: true } } },
        orderBy: { firstSeenAt: 'desc' },
        take: 50,
      }),
      this.prisma.jobListing.count({
        where: {
          partner: { userId },
          firstSeenAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      this.prisma.scrapeRun.findFirst({
        where: { userId },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    const partnersWithActiveListings = await this.prisma.partner.count({
      where: {
        userId,
        isActive: true,
        jobListings: { some: { status: 'active' } },
      },
    });

    // Calculate rotation info
    const batchSize = PartnerMonitorService.BATCH_SIZE;
    const rotationDays = activePartners > 0 ? Math.ceil(activePartners / batchSize) : 1;

    return {
      totalPartners,
      activePartners,
      partnersWithActiveListings,
      newToday,
      recentListings,
      lastRun,
      rotation: {
        batchSize,
        rotationDays,
        note: activePartners > batchSize
          ? `Naponta ${batchSize} partner kerul ellenorzesre, ${rotationDays} napos ciklusban`
          : 'Minden partner naponta kerul ellenorzesre',
      },
    };
  }

  async getJobListings(userId: string, options?: {
    partnerId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { partner: { userId } };
    if (options?.partnerId) where.partnerId = options.partnerId;
    if (options?.status) where.status = options.status;

    const [items, total] = await Promise.all([
      this.prisma.jobListing.findMany({
        where,
        include: { partner: { select: { companyName: true, id: true } } },
        orderBy: { firstSeenAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.jobListing.count({ where }),
    ]);

    return { items, total };
  }

  // ─── PROFESSION.HU KÖZVETLEN KERESÉS ────────────────────

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // ékezetek eltávolítása
      .replace(/[^a-z0-9]+/g, '-')                       // nem alfanumerikus → kötőjel
      .replace(/^-+|-+$/g, '');                           // szélső kötőjelek levágása
  }

  async searchProfessionHu(companyName: string): Promise<JobSearchResult[]> {
    const slug = this.toSlug(companyName);
    const searchUrl = `https://www.profession.hu/cegek/${slug}/allasok`;

    try {
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'hu-HU,hu;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Profession.hu cég nem található: "${companyName}" (${slug}) → ${response.status}`);
        return [];
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const results: JobSearchResult[] = [];

      // Company page uses h2.job-card__title > a for job links
      $('.job-card__title').each((_, el) => {
        const h2 = $(el);
        const a = h2.find('a');
        const title = a.text().trim();
        const href = a.attr('href') || '';
        const card = h2.closest('li, div').first();
        const company = card.find('.job-card__company-name').text().trim();
        const location = card.find('.job-card__company-address').text().trim().replace(/[\n\t•]+/g, ' ').replace(/\s+/g, ' ').trim();

        if (href && title) {
          const link = href.split('?')[0];
          const fullLink = link.startsWith('http') ? link : `https://www.profession.hu${link}`;
          results.push({
            title,
            link: fullLink,
            snippet: [company, location].filter(Boolean).join(' · '),
          });
        }
      });

      this.logger.log(`Profession.hu keresés "${companyName}" (${slug}): ${results.length} találat`);
      return results;
    } catch (error: any) {
      this.logger.error(`Profession.hu keresés hiba: ${error.message}`);
      return [];
    }
  }

  // ─── SCAN LOGIC (called by scheduler) ───────────────────

  /** Max partners per scan batch (rate limiting towards profession.hu) */
  private static readonly BATCH_SIZE = 200;

  async scanAllPartners(userId?: string) {
    const where: any = { isActive: true };
    if (userId) where.userId = userId;

    // Rotation: pick the partners least recently checked first, limit to BATCH_SIZE
    const partners = await this.prisma.partner.findMany({
      where,
      orderBy: [
        { lastCheckedAt: { sort: 'asc', nulls: 'first' } },
      ],
      take: PartnerMonitorService.BATCH_SIZE,
    });
    if (partners.length === 0) return;

    const run = await this.prisma.scrapeRun.create({
      data: { userId: userId || null, status: 'running' },
    });

    let newListingsTotal = 0;
    let errorsTotal = 0;
    const errorMessages: string[] = [];

    for (const partner of partners) {
      try {
        const results = await this.searchProfessionHu(partner.companyName);

        for (const result of results) {
          const existing = await this.prisma.jobListing.findUnique({
            where: { partnerId_url: { partnerId: partner.id, url: result.link } },
          });

          if (existing) {
            await this.prisma.jobListing.update({
              where: { id: existing.id },
              data: { lastSeenAt: new Date(), status: 'active' },
            });
          } else {
            await this.prisma.jobListing.create({
              data: {
                partnerId: partner.id,
                title: result.title,
                url: result.link,
                snippet: result.snippet,
                status: 'new',
              },
            });
            newListingsTotal++;
          }
        }

        await this.prisma.partner.update({
          where: { id: partner.id },
          data: { lastCheckedAt: new Date() },
        });

        // Rate limit: wait 2s between partners to be polite towards profession.hu
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        errorsTotal++;
        errorMessages.push(`${partner.companyName}: ${error.message}`);
        this.logger.error(`Scan hiba (${partner.companyName}): ${error.message}`);
      }
    }

    // Mark listings not seen in 7 days as expired
    await this.prisma.jobListing.updateMany({
      where: {
        partner: { isActive: true, ...(userId ? { userId } : {}) },
        lastSeenAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        status: { not: 'expired' },
      },
      data: { status: 'expired' },
    });

    await this.prisma.scrapeRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        partnersScanned: partners.length,
        newListings: newListingsTotal,
        errors: errorsTotal,
        status: errorsTotal > 0 && errorsTotal === partners.length ? 'failed' : 'completed',
        errorLog: errorMessages.length > 0 ? errorMessages.join('\n') : null,
      },
    });

    this.logger.log(
      `Scan kész: ${partners.length} partner, ${newListingsTotal} új hirdetés, ${errorsTotal} hiba`,
    );

    return { partnersScanned: partners.length, newListings: newListingsTotal, errors: errorsTotal };
  }

  async getNewUnnotifiedListings(userId: string) {
    return this.prisma.jobListing.findMany({
      where: {
        partner: { userId },
        status: 'new',
        notified: false,
      },
      include: { partner: { select: { companyName: true } } },
      orderBy: { firstSeenAt: 'desc' },
    });
  }

  async markAsNotified(listingIds: string[]) {
    if (listingIds.length === 0) return;
    await this.prisma.jobListing.updateMany({
      where: { id: { in: listingIds } },
      data: { notified: true, status: 'active' },
    });
  }

  // ─── E-CÉGJEGYZÉK LOOKUP ────────────────────────────────

  async lookupCompany(companyName: string) {
    // The e-cégjegyzék (occsz.e-cegjegyzek.hu) is a public government registry.
    // We search via their public search form.
    const searchUrl = `https://occsz.e-cegjegyzek.hu/info/page/ceg?celeskereses=true&cegnev=${encodeURIComponent(companyName)}`;

    try {
      const response = await fetch(searchUrl, {
        headers: { 'Accept': 'text/html', 'User-Agent': 'Legitas/1.0' },
      });

      if (!response.ok) {
        this.logger.warn(`E-cégjegyzék keresés sikertelen: ${response.status}`);
        return { searchUrl, results: [] };
      }

      // Return the search URL for the user to verify manually
      // (Full HTML parsing of government sites is fragile, better to show the link)
      return { searchUrl };
    } catch (error: any) {
      this.logger.error(`E-cégjegyzék hiba: ${error.message}`);
      return { searchUrl, error: error.message };
    }
  }

  async getScrapeRuns(userId: string, limit = 10) {
    return this.prisma.scrapeRun.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  async getRunListings(userId: string, runId: string) {
    const run = await this.prisma.scrapeRun.findFirst({
      where: { id: runId, userId },
    });
    if (!run) return [];

    return this.prisma.jobListing.findMany({
      where: {
        partner: { userId },
        firstSeenAt: {
          gte: run.startedAt,
          ...(run.finishedAt ? { lte: run.finishedAt } : {}),
        },
      },
      include: { partner: { select: { companyName: true } } },
      orderBy: [{ partner: { companyName: 'asc' } }, { title: 'asc' }],
    });
  }

  // ─── VALIDATE COMPANY ON PROFESSION.HU ────────────────

  async validateCompany(companyName: string) {
    const slug = this.toSlug(companyName);
    const url = `https://www.profession.hu/cegek/${slug}/allasok`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        return { found: false, slug, url, listingsCount: 0 };
      }

      const html = await response.text();
      const cheerioLib = await import('cheerio');
      const $ = cheerioLib.load(html);
      const count = $('.job-card__title').length;

      return { found: true, slug, url, listingsCount: count };
    } catch {
      return { found: false, slug, url, listingsCount: 0 };
    }
  }

  // ─── DIGEST CONFIG ────────────────────────────────────

  async getDigestConfig(userId: string) {
    let config = await this.prisma.partnerDigestConfig.findUnique({
      where: { userId },
    });
    if (!config) {
      config = await this.prisma.partnerDigestConfig.create({
        data: { userId, enabled: true, emails: [] },
      });
    }
    return config;
  }

  async updateDigestConfig(userId: string, data: { enabled?: boolean; emails?: string[] }) {
    const existing = await this.prisma.partnerDigestConfig.findUnique({ where: { userId } });
    if (existing) {
      return this.prisma.partnerDigestConfig.update({
        where: { userId },
        data,
      });
    }
    return this.prisma.partnerDigestConfig.create({
      data: { userId, enabled: data.enabled ?? true, emails: data.emails ?? [] },
    });
  }

  async getDigestRecipients(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user) return [];

    const config = await this.prisma.partnerDigestConfig.findUnique({
      where: { userId },
    });

    if (config && !config.enabled) return [];

    const emails = [user.email];
    if (config?.emails?.length) {
      emails.push(...config.emails.filter((e) => e && !emails.includes(e)));
    }
    return emails;
  }
}
