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

  // ─── LIST CRUD ─────────────────────────────────────────

  async createList(userId: string, data: { name: string; description?: string; emails?: string[] }) {
    const existing = await this.prisma.partnerList.findUnique({
      where: { userId_name: { userId, name: data.name } },
    });
    if (existing) throw new ConflictException(`"${data.name}" lista már létezik`);
    return this.prisma.partnerList.create({
      data: { userId, name: data.name, description: data.description, emails: data.emails || [] },
    });
  }

  async getLists(userId: string) {
    return this.prisma.partnerList.findMany({
      where: { userId },
      include: {
        _count: { select: { partners: true, scrapeRuns: true } },
        partners: {
          select: { id: true, companyName: true, isActive: true, _count: { select: { jobListings: { where: { status: 'active' } } } } },
          orderBy: { companyName: 'asc' },
        },
        scrapeRuns: { orderBy: { startedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getList(userId: string, listId: string) {
    const list = await this.prisma.partnerList.findFirst({
      where: { id: listId, userId },
      include: {
        partners: {
          include: {
            jobListings: { where: { status: { in: ['active', 'new'] } }, orderBy: { firstSeenAt: 'desc' } },
            _count: { select: { jobListings: true } },
          },
          orderBy: { companyName: 'asc' },
        },
        scrapeRuns: { orderBy: { startedAt: 'desc' }, take: 20 },
      },
    });
    if (!list) throw new NotFoundException('Lista nem található');
    return list;
  }

  async updateList(userId: string, listId: string, data: { name?: string; description?: string; emails?: string[]; emailEnabled?: boolean; isActive?: boolean }) {
    const list = await this.prisma.partnerList.findFirst({ where: { id: listId, userId } });
    if (!list) throw new NotFoundException('Lista nem található');
    return this.prisma.partnerList.update({ where: { id: listId }, data });
  }

  async deleteList(userId: string, listId: string) {
    const list = await this.prisma.partnerList.findFirst({ where: { id: listId, userId } });
    if (!list) throw new NotFoundException('Lista nem található');
    // Unassign partners (don't delete them)
    await this.prisma.partner.updateMany({ where: { listId }, data: { listId: null } });
    await this.prisma.partnerList.delete({ where: { id: listId } });
    return { deleted: true };
  }

  // ─── PARTNER CRUD ────────────────────────────────────────

  async createPartner(userId: string, dto: CreatePartnerDto & { listId?: string }) {
    const existing = await this.prisma.partner.findUnique({
      where: { userId_companyName: { userId, companyName: dto.companyName } },
    });
    if (existing) {
      // If partner exists but needs to be assigned to a list
      if (dto.listId && existing.listId !== dto.listId) {
        return this.prisma.partner.update({
          where: { id: existing.id },
          data: { listId: dto.listId },
        });
      }
      throw new ConflictException(`Partner "${dto.companyName}" már létezik`);
    }
    const { listId, ...rest } = dto;
    return this.prisma.partner.create({
      data: { userId, listId: listId || null, ...rest },
    });
  }

  async bulkCreatePartners(userId: string, partners: (CreatePartnerDto & { listId?: string })[]) {
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

  async getPartners(userId: string, options?: { isActive?: boolean; search?: string; listId?: string }) {
    const where: any = { userId };
    if (options?.isActive !== undefined) where.isActive = options.isActive;
    if (options?.search) where.companyName = { contains: options.search, mode: 'insensitive' };
    if (options?.listId) where.listId = options.listId;

    return this.prisma.partner.findMany({
      where,
      include: {
        jobListings: { where: { status: 'active' }, orderBy: { firstSeenAt: 'desc' }, take: 5 },
        _count: { select: { jobListings: true } },
        list: { select: { id: true, name: true } },
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

  async updatePartner(userId: string, partnerId: string, dto: UpdatePartnerDto & { listId?: string | null }) {
    const partner = await this.prisma.partner.findFirst({ where: { id: partnerId, userId } });
    if (!partner) throw new NotFoundException('Partner nem található');
    return this.prisma.partner.update({ where: { id: partnerId }, data: dto });
  }

  async deletePartner(userId: string, partnerId: string) {
    const partner = await this.prisma.partner.findFirst({ where: { id: partnerId, userId } });
    if (!partner) throw new NotFoundException('Partner nem található');
    await this.prisma.partner.delete({ where: { id: partnerId } });
    return { deleted: true };
  }

  // ─── DASHBOARD / STATS ──────────────────────────────────

  async getDashboard(userId: string, listId?: string) {
    const partnerWhere: any = { userId, isActive: true };
    if (listId) partnerWhere.listId = listId;

    const [totalPartners, activePartners, recentListings, newToday, lastRun] = await Promise.all([
      this.prisma.partner.count({ where: { userId, ...(listId ? { listId } : {}) } }),
      this.prisma.partner.count({ where: partnerWhere }),
      this.prisma.jobListing.findMany({
        where: { partner: partnerWhere, status: { in: ['active', 'new'] } },
        include: { partner: { select: { companyName: true } } },
        orderBy: { firstSeenAt: 'desc' },
        take: 200,
      }),
      this.prisma.jobListing.count({
        where: { partner: partnerWhere, firstSeenAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      }),
      this.prisma.scrapeRun.findFirst({
        where: { userId, ...(listId ? { listId } : {}) },
        orderBy: { startedAt: 'desc' },
      }),
    ]);

    const partnersWithActiveListings = await this.prisma.partner.count({
      where: { ...partnerWhere, jobListings: { some: { status: 'active' } } },
    });

    return { totalPartners, activePartners, partnersWithActiveListings, newToday, recentListings, lastRun };
  }

  async getJobListings(userId: string, options?: { partnerId?: string; status?: string; limit?: number; offset?: number }) {
    const where: any = { partner: { userId } };
    if (options?.partnerId) where.partnerId = options.partnerId;
    if (options?.status) where.status = options.status;
    const [items, total] = await Promise.all([
      this.prisma.jobListing.findMany({
        where, include: { partner: { select: { companyName: true, id: true } } },
        orderBy: { firstSeenAt: 'desc' }, take: options?.limit || 50, skip: options?.offset || 0,
      }),
      this.prisma.jobListing.count({ where }),
    ]);
    return { items, total };
  }

  // ─── PROFESSION.HU KÖZVETLEN KERESÉS ────────────────────

  private toSlug(name: string): string {
    return name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  async searchProfessionHu(companyName: string): Promise<JobSearchResult[]> {
    const slug = this.toSlug(companyName);
    const searchUrl = `https://www.profession.hu/cegek/${slug}/allasok`;
    try {
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml', 'Accept-Language': 'hu-HU,hu;q=0.9',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
      });
      if (!response.ok) { this.logger.warn(`Profession.hu cég nem található: "${companyName}" (${slug})`); return []; }
      const html = await response.text();
      const $ = cheerio.load(html);
      const results: JobSearchResult[] = [];
      $('.job-card__title').each((_, el) => {
        const h2 = $(el); const a = h2.find('a');
        const title = a.text().trim(); const href = a.attr('href') || '';
        const card = h2.closest('li, div').first();
        const company = card.find('.job-card__company-name').text().trim();
        const location = card.find('.job-card__company-address').text().trim().replace(/[\n\t•]+/g, ' ').replace(/\s+/g, ' ').trim();
        if (href && title) {
          const link = href.split('?')[0];
          const fullLink = link.startsWith('http') ? link : `https://www.profession.hu${link}`;
          results.push({ title, link: fullLink, snippet: [company, location].filter(Boolean).join(' · ') });
        }
      });
      this.logger.log(`Profession.hu keresés "${companyName}" (${slug}): ${results.length} találat`);
      return results;
    } catch (error: any) {
      this.logger.error(`Profession.hu keresés hiba: ${error.message}`);
      return [];
    }
  }

  // ─── WEBSITE SCRAPING ───────────────────────────────────

  async scrapeWebsiteJobCount(websiteUrl: string): Promise<number> {
    if (!websiteUrl) return 0;
    try {
      let totalCount = 0;
      let page = 1;
      const maxPages = 10;

      while (page <= maxPages) {
        const url = page === 1 ? websiteUrl : `${websiteUrl}${websiteUrl.includes('?') ? '&' : '?'}page=${page}`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'text/html' },
          signal: AbortSignal.timeout(15000),
          redirect: 'follow',
        });
        if (!res.ok) break;

        const html = await res.text();
        const $ = cheerio.load(html);
        $('script,style,nav,footer,header').remove();

        // Count job cards using common selectors
        const selectors = [
          '.job-card', '.job-item', '[class*="job-card"]',
          '[class*="job"] .card', '[class*="allas"]', '[class*="munka-"]',
          '.diakmunka-blog', '.vacancy', '.opening', '.offer-item',
        ];
        let pageCount = 0;
        for (const sel of selectors) {
          const c = $(sel).length;
          if (c > pageCount && c < 2000) pageCount = c;
        }

        // Fallback: count job-related links
        if (pageCount === 0) {
          const jobLinks = $('a[href]').filter((_, el) => {
            const href = $(el).attr('href') || '';
            return /(?:allas|munka|job|pozicio|diakmunka|vacancy)/.test(href.toLowerCase());
          }).length;
          if (jobLinks > 2) pageCount = Math.floor(jobLinks / 2);
        }

        if (pageCount === 0) break; // No more results
        totalCount += pageCount;

        // Check if there's a next page
        const hasNext = $('a[href*="page=' + (page + 1) + '"]').length > 0 ||
                        $('[class*="pagination"] a').filter((_, el) => $(el).text().trim() === String(page + 1)).length > 0;
        if (!hasNext) break;
        page++;
        await new Promise(r => setTimeout(r, 1000));
      }

      this.logger.log(`Website scan "${websiteUrl}": ${totalCount} pozíció (${page} oldal)`);
      return totalCount;
    } catch (error: any) {
      this.logger.warn(`Website scan hiba (${websiteUrl}): ${error.message}`);
      return 0;
    }
  }

  // ─── SCAN LOGIC ────────────────────────────────────────

  private static readonly BATCH_SIZE = 200;

  async scanList(userId: string, listId: string) {
    const partners = await this.prisma.partner.findMany({
      where: { listId, isActive: true },
      orderBy: [{ lastCheckedAt: { sort: 'asc', nulls: 'first' } }],
      take: PartnerMonitorService.BATCH_SIZE,
    });
    if (partners.length === 0) return { partnersScanned: 0, newListings: 0, errors: 0 };
    return this._doScan(partners, userId, listId);
  }

  async scanAllPartners(userId?: string) {
    const where: any = { isActive: true };
    if (userId) where.userId = userId;
    const partners = await this.prisma.partner.findMany({
      where, orderBy: [{ lastCheckedAt: { sort: 'asc', nulls: 'first' } }],
      take: PartnerMonitorService.BATCH_SIZE,
    });
    if (partners.length === 0) return;
    return this._doScan(partners, userId || null, null);
  }

  private async _doScan(partners: any[], userId: string | null, listId: string | null) {
    const run = await this.prisma.scrapeRun.create({
      data: { userId, listId, status: 'running' },
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
              where: { id: existing.id }, data: { lastSeenAt: new Date(), status: 'active' },
            });
          } else {
            await this.prisma.jobListing.create({
              data: { partnerId: partner.id, title: result.title, url: result.link, snippet: result.snippet, status: 'new' },
            });
            newListingsTotal++;
          }
        }

        // Scrape website if URL is set
        const websiteCount = partner.websiteUrl ? await this.scrapeWebsiteJobCount(partner.websiteUrl) : 0;

        // Save snapshot: profession.hu + website counts
        const activeCount = await this.prisma.jobListing.count({
          where: { partnerId: partner.id, status: { in: ['active', 'new'] } },
        });
        await this.prisma.partnerSnapshot.create({
          data: { partnerId: partner.id, scrapeRunId: run.id, activeListings: activeCount, websiteListings: websiteCount },
        });

        await this.prisma.partner.update({
          where: { id: partner.id }, data: { lastCheckedAt: new Date() },
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        errorsTotal++;
        errorMessages.push(`${partner.companyName}: ${error.message}`);
        this.logger.error(`Scan hiba (${partner.companyName}): ${error.message}`);
      }
    }

    // Mark listings not seen in 7 days as expired
    const partnerIds = partners.map(p => p.id);
    await this.prisma.jobListing.updateMany({
      where: { partnerId: { in: partnerIds }, lastSeenAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, status: { not: 'expired' } },
      data: { status: 'expired' },
    });

    await this.prisma.scrapeRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(), partnersScanned: partners.length, newListings: newListingsTotal,
        errors: errorsTotal, status: errorsTotal > 0 && errorsTotal === partners.length ? 'failed' : 'completed',
        errorLog: errorMessages.length > 0 ? errorMessages.join('\n') : null,
      },
    });

    this.logger.log(`Scan kész: ${partners.length} partner, ${newListingsTotal} új hirdetés, ${errorsTotal} hiba`);
    return { partnersScanned: partners.length, newListings: newListingsTotal, errors: errorsTotal };
  }

  // ─── CHART DATA ────────────────────────────────────────

  async getChartData(userId: string, listId?: string, partnerId?: string) {
    const where: any = { partner: { userId } };
    if (listId) where.partner.listId = listId;
    if (partnerId) where.partnerId = partnerId;

    const snapshots = await this.prisma.partnerSnapshot.findMany({
      where,
      include: { partner: { select: { companyName: true } }, scrapeRun: { select: { startedAt: true } } },
      orderBy: { date: 'asc' },
    });

    // Group by date (day) and partner
    const byDate: Record<string, Record<string, number>> = {};
    const companies = new Set<string>();

    for (const snap of snapshots) {
      const day = snap.scrapeRun.startedAt.toISOString().split('T')[0];
      const company = snap.partner.companyName;
      companies.add(company);
      if (!byDate[day]) byDate[day] = {};
      byDate[day][company] = snap.activeListings;
    }

    // Build chart-friendly array
    const dates = Object.keys(byDate).sort();
    const chartData = dates.map(date => {
      const entry: Record<string, any> = { date };
      let total = 0;
      for (const company of companies) {
        const count = byDate[date][company] || 0;
        entry[company] = count;
        total += count;
      }
      entry.total = total;
      return entry;
    });

    return { chartData, companies: Array.from(companies).sort() };
  }

  // ─── SCAN RUNS & LISTINGS ─────────────────────────────

  async getNewUnnotifiedListings(userId: string) {
    return this.prisma.jobListing.findMany({
      where: { partner: { userId }, status: 'new', notified: false },
      include: { partner: { select: { companyName: true } } },
      orderBy: { firstSeenAt: 'desc' },
    });
  }

  async markAsNotified(listingIds: string[]) {
    if (listingIds.length === 0) return;
    await this.prisma.jobListing.updateMany({
      where: { id: { in: listingIds } }, data: { notified: true, status: 'active' },
    });
  }

  async getScrapeRuns(userId: string, listId?: string, limit = 20) {
    const where: any = { userId };
    if (listId) where.listId = listId;
    return this.prisma.scrapeRun.findMany({ where, orderBy: { startedAt: 'desc' }, take: limit });
  }

  async getRunListings(userId: string, runId: string) {
    const run = await this.prisma.scrapeRun.findFirst({ where: { id: runId, userId } });
    if (!run) return [];
    return this.prisma.jobListing.findMany({
      where: {
        partner: { userId },
        firstSeenAt: { gte: run.startedAt, ...(run.finishedAt ? { lte: run.finishedAt } : {}) },
      },
      include: { partner: { select: { companyName: true } } },
      orderBy: [{ partner: { companyName: 'asc' } }, { title: 'asc' }],
    });
  }

  // ─── E-CÉGJEGYZÉK LOOKUP ────────────────────────────────

  async lookupCompany(companyName: string) {
    const searchUrl = `https://occsz.e-cegjegyzek.hu/info/page/ceg?celeskereses=true&cegnev=${encodeURIComponent(companyName)}`;
    try {
      const response = await fetch(searchUrl, { headers: { 'Accept': 'text/html', 'User-Agent': 'Legitas/1.0' } });
      if (!response.ok) return { searchUrl, results: [] };
      return { searchUrl };
    } catch (error: any) {
      return { searchUrl, error: error.message };
    }
  }

  // ─── VALIDATE COMPANY ON PROFESSION.HU ────────────────

  async validateCompany(companyName: string) {
    const slug = this.toSlug(companyName);
    const url = `https://www.profession.hu/cegek/${slug}/allasok`;
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'text/html', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      if (!response.ok) return { found: false, slug, url, listingsCount: 0 };
      const html = await response.text();
      const cheerioLib = await import('cheerio');
      const $ = cheerioLib.load(html);
      return { found: true, slug, url, listingsCount: $('.job-card__title').length };
    } catch {
      return { found: false, slug, url, listingsCount: 0 };
    }
  }

  // ─── DIGEST CONFIG ────────────────────────────────────

  async getDigestConfig(userId: string) {
    let config = await this.prisma.partnerDigestConfig.findUnique({ where: { userId } });
    if (!config) config = await this.prisma.partnerDigestConfig.create({ data: { userId, enabled: true, emails: [] } });
    return config;
  }

  async updateDigestConfig(userId: string, data: { enabled?: boolean; emails?: string[] }) {
    const existing = await this.prisma.partnerDigestConfig.findUnique({ where: { userId } });
    if (existing) return this.prisma.partnerDigestConfig.update({ where: { userId }, data });
    return this.prisma.partnerDigestConfig.create({ data: { userId, enabled: data.enabled ?? true, emails: data.emails ?? [] } });
  }

  async getDigestRecipients(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) return [];
    const config = await this.prisma.partnerDigestConfig.findUnique({ where: { userId } });
    if (config && !config.enabled) return [];
    const emails = [user.email];
    if (config?.emails?.length) emails.push(...config.emails.filter((e) => e && !emails.includes(e)));
    return emails;
  }
}
