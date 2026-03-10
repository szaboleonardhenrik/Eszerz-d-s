import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PdfService } from '../pdf/pdf.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ConfigService } from '@nestjs/config';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateQuoteTemplateDto } from './dto/create-quote-template.dto';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private pdfService: PdfService,
    private webhooksService: WebhooksService,
    private config: ConfigService,
  ) {}

  // ─── QUOTES ──────────────────────────────────────────────

  private async generateQuoteNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.quote.count({
      where: {
        ownerId: userId,
        createdAt: { gte: new Date(`${year}-01-01`) },
      },
    });
    return `AJ-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // ─── SUBSCRIPTION TIER LIMITS ────────────────────────
  private readonly quoteTierLimits: Record<string, number> = {
    free: 3,
    starter: 5,
    medium: 20,
    premium: 50,
    enterprise: 500,
    basic: 20,   // legacy
    pro: 50,     // legacy
  };

  async create(userId: string, dto: CreateQuoteDto) {
    // Subscription limit check
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const tier = user?.subscriptionTier ?? 'free';
    const maxQuotes = this.quoteTierLimits[tier] ?? 3;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCount = await this.prisma.quote.count({
      where: {
        ownerId: userId,
        createdAt: { gte: startOfMonth },
      },
    });

    if (monthlyCount >= maxQuotes) {
      throw new ForbiddenException(
        'Elérted a havi ajánlat limitedet. Frissíts magasabb csomagra a további ajánlatokhoz.',
      );
    }

    const quoteNumber = await this.generateQuoteNumber(userId);

    return this.prisma.quote.create({
      data: {
        ownerId: userId,
        templateId: dto.templateId ?? null,
        title: dto.title,
        quoteNumber,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientCompany: dto.clientCompany,
        clientPhone: dto.clientPhone,
        clientAddress: dto.clientAddress,
        clientTaxNumber: dto.clientTaxNumber,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        currency: dto.currency ?? 'HUF',
        language: dto.language ?? 'hu',
        introText: dto.introText,
        outroText: dto.outroText,
        notes: dto.notes,
        discount: dto.discount,
        discountType: dto.discountType,
        variablesData: dto.variablesData,
        items: {
          create: dto.items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice,
            unit: item.unit ?? 'db',
            taxRate: item.taxRate ?? 27,
            sectionName: item.sectionName,
            isOptional: item.isOptional ?? false,
            discount: item.discount,
            discountType: item.discountType,
            sortOrder: item.sortOrder ?? idx,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async findAllByUser(userId: string, status?: string, search?: string, page = 1, limit = 20) {
    const where: any = { ownerId: userId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { clientCompany: { contains: search, mode: 'insensitive' } },
        { quoteNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: { items: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.quote.count({ where }),
    ]);

    return { quotes, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        owner: {
          select: {
            name: true, companyName: true, email: true,
            brandLogoUrl: true, brandColor: true, phone: true, taxNumber: true,
          },
        },
      },
    });
    if (!quote) throw new NotFoundException('Quote not found');
    if (quote.ownerId !== userId) throw new ForbiddenException('Access denied');
    return quote;
  }

  async update(id: string, userId: string, dto: CreateQuoteDto) {
    const quote = await this.findOne(id, userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });

      return tx.quote.update({
        where: { id },
        data: {
          title: dto.title,
          clientName: dto.clientName,
          clientEmail: dto.clientEmail,
          clientCompany: dto.clientCompany,
          clientPhone: dto.clientPhone,
          clientAddress: dto.clientAddress,
          clientTaxNumber: dto.clientTaxNumber,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          currency: dto.currency ?? quote.currency,
          language: dto.language ?? quote.language ?? 'hu',
          introText: dto.introText,
          outroText: dto.outroText,
          notes: dto.notes,
          discount: dto.discount,
          discountType: dto.discountType,
          variablesData: dto.variablesData,
          templateId: dto.templateId ?? quote.templateId,
          items: {
            create: dto.items.map((item, idx) => ({
              description: item.description,
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice,
              unit: item.unit ?? 'db',
              taxRate: item.taxRate ?? 27,
              sectionName: item.sectionName,
              isOptional: item.isOptional ?? false,
              discount: item.discount,
              discountType: item.discountType,
              sortOrder: item.sortOrder ?? idx,
            })),
          },
        },
        include: { items: { orderBy: { sortOrder: 'asc' } } },
      });
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.quote.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── SEND QUOTE (email + token) ────────────────────────

  async sendQuote(id: string, userId: string) {
    const quote = await this.findOne(id, userId);

    if (quote.status !== 'draft') {
      throw new BadRequestException('Csak piszkozat statuszú ajánlat küldhető el');
    }

    const viewToken = randomBytes(32).toString('hex');
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const viewUrl = `${frontendUrl}/quote-view/${viewToken}`;

    const updated = await this.prisma.quote.update({
      where: { id },
      data: { status: 'sent', viewToken, version: quote.version + 1 },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    // Send email to client
    try {
      const totals = this.calcQuoteTotal(quote.items, quote.discount, quote.discountType);
      const formatNum = (n: number) => new Intl.NumberFormat('hu-HU').format(Math.round(n));
      const curMap: Record<string, string> = { HUF: 'Ft', EUR: 'EUR', USD: 'USD' };
      const cur = curMap[quote.currency] ?? quote.currency;

      const ownerName = quote.owner?.companyName || quote.owner?.name || 'Felado';

      await this.notifications.sendQuoteToClient({
        to: quote.clientEmail,
        clientName: quote.clientName,
        senderName: ownerName,
        quoteTitle: quote.title,
        quoteNumber: quote.quoteNumber ?? '',
        totalAmount: `${formatNum(totals.brutto)} ${cur}`,
        viewUrl,
        validUntil: quote.validUntil ? quote.validUntil.toLocaleDateString('hu-HU') : null,
      });
    } catch (error) {
      this.logger.error(`Failed to send quote email to ${quote.clientEmail}`, error);
      // Don't fail the status update if email fails
    }

    // Dispatch webhook
    this.webhooksService.triggerWebhooks(quote.ownerId, 'quote.sent', {
      quoteId: updated.id,
      quoteNumber: updated.quoteNumber,
      title: updated.title,
      clientName: updated.clientName,
      clientEmail: updated.clientEmail,
      status: updated.status,
    });

    return updated;
  }

  // ─── RESEND QUOTE (new version) ──────────────────────

  async resendQuote(id: string, userId: string) {
    const quote = await this.findOne(id, userId);

    if (quote.status !== 'sent' && quote.status !== 'declined' && quote.status !== 'expired') {
      throw new BadRequestException('Csak elküldött, elutasított vagy lejárt ajánlat küldhető újra');
    }

    const oldViewToken = quote.viewToken;
    const newViewToken = randomBytes(32).toString('hex');
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const viewUrl = `${frontendUrl}/quote-view/${newViewToken}`;

    const updated = await this.prisma.quote.update({
      where: { id },
      data: {
        status: 'sent',
        viewToken: newViewToken,
        version: quote.version + 1,
        declineReason: null,
        declinedAt: null,
        acceptedAt: null,
      },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        owner: {
          select: {
            name: true, companyName: true, email: true,
            brandLogoUrl: true, brandColor: true, phone: true, taxNumber: true,
          },
        },
      },
    });

    // Send email to client
    try {
      const totals = this.calcQuoteTotal(updated.items, updated.discount, updated.discountType);
      const formatNum = (n: number) => new Intl.NumberFormat('hu-HU').format(Math.round(n));
      const curMap: Record<string, string> = { HUF: 'Ft', EUR: 'EUR', USD: 'USD' };
      const cur = curMap[updated.currency] ?? updated.currency;

      const ownerName = updated.owner?.companyName || updated.owner?.name || 'Felado';

      await this.notifications.sendQuoteToClient({
        to: updated.clientEmail,
        clientName: updated.clientName,
        senderName: ownerName,
        quoteTitle: updated.title,
        quoteNumber: updated.quoteNumber ?? '',
        totalAmount: `${formatNum(totals.brutto)} ${cur}`,
        viewUrl,
        validUntil: updated.validUntil ? updated.validUntil.toLocaleDateString('hu-HU') : null,
      });
    } catch (error) {
      this.logger.error(`Failed to send resend quote email to ${updated.clientEmail}`, error);
    }

    return updated;
  }

  // ─── PUBLIC VIEW (token-based) ─────────────────────────

  async getQuoteByToken(token: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { viewToken: token },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        owner: {
          select: {
            name: true, companyName: true, email: true,
            brandLogoUrl: true, brandColor: true, phone: true, taxNumber: true,
          },
        },
      },
    });

    if (!quote) throw new NotFoundException('Érvénytelen ajánlat link');

    // Don't expose private notes
    return { ...quote, notes: undefined };
  }

  async acceptQuoteByToken(token: string, clientNote?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { viewToken: token },
      include: { owner: { select: { email: true, name: true, notifyOnSign: true } } },
    });

    if (!quote) throw new NotFoundException('Érvénytelen ajánlat link');
    if (quote.status !== 'sent') throw new BadRequestException('Ez az ajánlat már nem módosítható');

    if (quote.validUntil && quote.validUntil < new Date()) {
      await this.prisma.quote.update({ where: { id: quote.id }, data: { status: 'expired' } });
      throw new BadRequestException('Az ajánlat lejárt');
    }

    const updated = await this.prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'accepted', acceptedAt: new Date() },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    // Notify owner
    if (quote.owner.notifyOnSign) {
      try {
        await this.notifications.sendQuoteAccepted({
          to: quote.owner.email,
          ownerName: quote.owner.name,
          quoteTitle: quote.title,
          clientName: quote.clientName,
          quoteNumber: quote.quoteNumber ?? '',
        });
      } catch (error) {
        this.logger.error(`Failed to send quote accepted notification`, error);
      }
    }

    // Dispatch webhook
    this.webhooksService.triggerWebhooks(quote.ownerId, 'quote.accepted', {
      quoteId: updated.id,
      quoteNumber: quote.quoteNumber,
      title: quote.title,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      status: updated.status,
      acceptedAt: updated.acceptedAt,
    });

    return updated;
  }

  async declineQuoteByToken(token: string, reason?: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { viewToken: token },
      include: { owner: { select: { email: true, name: true, notifyOnDecline: true } } },
    });

    if (!quote) throw new NotFoundException('Érvénytelen ajánlat link');
    if (quote.status !== 'sent') throw new BadRequestException('Ez az ajánlat már nem módosítható');

    const updated = await this.prisma.quote.update({
      where: { id: quote.id },
      data: { status: 'declined', declinedAt: new Date(), declineReason: reason },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });

    // Notify owner
    if (quote.owner.notifyOnDecline) {
      try {
        await this.notifications.sendQuoteDeclined({
          to: quote.owner.email,
          ownerName: quote.owner.name,
          quoteTitle: quote.title,
          clientName: quote.clientName,
          quoteNumber: quote.quoteNumber ?? '',
          reason: reason ?? '',
        });
      } catch (error) {
        this.logger.error(`Failed to send quote declined notification`, error);
      }
    }

    // Dispatch webhook
    this.webhooksService.triggerWebhooks(quote.ownerId, 'quote.declined', {
      quoteId: updated.id,
      quoteNumber: quote.quoteNumber,
      title: quote.title,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      status: updated.status,
      declinedAt: updated.declinedAt,
      declineReason: updated.declineReason,
    });

    return updated;
  }

  // ─── CONVERT TO CONTRACT ───────────────────────────────

  async convertToContract(id: string, userId: string) {
    const quote = await this.findOne(id, userId);

    if (quote.status !== 'accepted') {
      throw new BadRequestException('Csak elfogadott ajánlatból hozható létre szerződés');
    }

    // Build contract HTML from quote
    const contractHtml = this.generateContractHtml(quote);

    const contract = await this.prisma.contract.create({
      data: {
        ownerId: userId,
        title: `Szerződés - ${quote.title}`,
        contentHtml: contractHtml,
        status: 'draft',
        variablesData: quote.variablesData,
      },
    });

    // Dispatch webhook
    this.webhooksService.triggerWebhooks(userId, 'quote.converted', {
      quoteId: quote.id,
      quoteNumber: quote.quoteNumber,
      title: quote.title,
      clientName: quote.clientName,
      clientEmail: quote.clientEmail,
      status: quote.status,
      contractId: contract.id,
      contractTitle: contract.title,
    });

    return contract;
  }

  private generateContractHtml(quote: any): string {
    const esc = (s: string) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const formatNum = (n: number) => new Intl.NumberFormat('hu-HU').format(Math.round(n));
    const curMap: Record<string, string> = { HUF: 'Ft', EUR: 'EUR', USD: 'USD' };
      const cur = curMap[quote.currency] ?? quote.currency;

    const ownerName = esc(quote.owner?.companyName || quote.owner?.name || '');
    const ownerEmail = esc(quote.owner?.email || '');
    const ownerTax = quote.owner?.taxNumber ? `<p>Adószám: ${esc(quote.owner.taxNumber)}</p>` : '';

    let itemsHtml = '';
    let totalNetto = 0;
    for (const item of quote.items) {
      if (item.isOptional) continue;
      let netto = item.quantity * item.unitPrice;
      if (item.discount && item.discountType) {
        if (item.discountType === 'percent') netto *= (1 - item.discount / 100);
        else netto -= item.discount;
      }
      netto = Math.max(0, netto);
      totalNetto += netto;
      itemsHtml += `<tr><td>${esc(item.description)}</td><td style="text-align:center;">${item.quantity} ${esc(item.unit)}</td><td style="text-align:right;">${formatNum(item.unitPrice)} ${cur}</td><td style="text-align:right;">${formatNum(netto)} ${cur}</td></tr>`;
    }

    if (quote.discount && quote.discountType) {
      const discAmount = quote.discountType === 'percent' ? totalNetto * (quote.discount / 100) : quote.discount;
      totalNetto = Math.max(0, totalNetto - discAmount);
    }

    return `<h1>SZERZŐDÉS</h1>
<h2>1. Szerződő felek</h2>
<p><strong>Megrendelő:</strong></p>
<p>Név: ${esc(quote.clientName)}</p>
${quote.clientCompany ? `<p>Cégnév: ${esc(quote.clientCompany)}</p>` : ''}
<p>Email: ${esc(quote.clientEmail)}</p>
${quote.clientPhone ? `<p>Telefon: ${esc(quote.clientPhone)}</p>` : ''}
${quote.clientAddress ? `<p>Cím: ${esc(quote.clientAddress)}</p>` : ''}
${quote.clientTaxNumber ? `<p>Adószám: ${esc(quote.clientTaxNumber)}</p>` : ''}

<p><strong>Vállalkozó:</strong></p>
<p>Név: ${ownerName}</p>
<p>Email: ${ownerEmail}</p>
${ownerTax}

<h2>2. A szerződés tárgya</h2>
<p>${esc(quote.title)}</p>
${quote.introText ? `<p>${esc(quote.introText)}</p>` : ''}

<h2>3. Szolgáltatások és díjazás</h2>
<table>
<thead><tr><th>Leírás</th><th>Mennyiség</th><th>Egységár</th><th>Összeg</th></tr></thead>
<tbody>${itemsHtml}</tbody>
</table>
<p><strong>Összesen (nettó): ${formatNum(totalNetto)} ${cur}</strong></p>

${quote.outroText ? `<h2>4. Egyéb feltételek</h2><p>${esc(quote.outroText)}</p>` : ''}

<h2>${quote.outroText ? '5' : '4'}. Záró rendelkezések</h2>
<p>Jelen szerződés az elfogadott ${quote.quoteNumber ?? ''} számú ajánlat alapján jött létre.</p>
<p>A felek a szerződést elolvasták, megértették, és mint akaratukkal mindenben megegyezőt jóváhagyólag írták alá.</p>
<p>Kelt: ${new Date().toLocaleDateString('hu-HU')}</p>`;
  }

  // ─── STATUS + STATS ────────────────────────────────────

  async updateStatus(id: string, userId: string, status: string) {
    await this.findOne(id, userId);
    return this.prisma.quote.update({
      where: { id },
      data: { status },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  async getStats(userId: string) {
    const [draft, sent, accepted, declined, expired] = await Promise.all([
      this.prisma.quote.count({ where: { ownerId: userId, status: 'draft' } }),
      this.prisma.quote.count({ where: { ownerId: userId, status: 'sent' } }),
      this.prisma.quote.count({ where: { ownerId: userId, status: 'accepted' } }),
      this.prisma.quote.count({ where: { ownerId: userId, status: 'declined' } }),
      this.prisma.quote.count({ where: { ownerId: userId, status: 'expired' } }),
    ]);

    const acceptedQuotes = await this.prisma.quote.findMany({
      where: { ownerId: userId, status: 'accepted' },
      include: { items: true },
    });

    const totalRevenue = acceptedQuotes.reduce((sum, quote) => {
      const t = this.calcQuoteTotal(quote.items, quote.discount, quote.discountType);
      return sum + t.brutto;
    }, 0);

    // Subscription usage
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const tier = user?.subscriptionTier ?? 'free';
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyUsage = await this.prisma.quote.count({
      where: { ownerId: userId, createdAt: { gte: startOfMonth } },
    });
    const monthlyLimit = this.quoteTierLimits[tier] ?? 3;

    return {
      draft, sent, accepted, declined, expired,
      total: draft + sent + accepted + declined + expired,
      totalRevenue,
      usage: { used: monthlyUsage, limit: monthlyLimit, tier },
    };
  }

  async duplicate(id: string, userId: string) {
    const original = await this.findOne(id, userId);
    const quoteNumber = await this.generateQuoteNumber(userId);

    return this.prisma.quote.create({
      data: {
        ownerId: userId,
        templateId: original.templateId,
        title: `${original.title} (masolat)`,
        quoteNumber,
        clientName: original.clientName,
        clientEmail: original.clientEmail,
        clientCompany: original.clientCompany,
        clientPhone: original.clientPhone,
        clientAddress: original.clientAddress,
        clientTaxNumber: original.clientTaxNumber,
        validUntil: null,
        currency: original.currency,
        language: original.language ?? 'hu',
        introText: original.introText,
        outroText: original.outroText,
        notes: original.notes,
        discount: original.discount,
        discountType: original.discountType,
        variablesData: original.variablesData,
        status: 'draft',
        items: {
          create: original.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.unit,
            taxRate: item.taxRate,
            sectionName: item.sectionName,
            isOptional: item.isOptional,
            discount: item.discount,
            discountType: item.discountType,
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  // ─── QUOTE TEMPLATES ────────────────────────────────────

  async createTemplate(userId: string, dto: CreateQuoteTemplateDto) {
    return this.prisma.quoteTemplate.create({
      data: {
        ownerId: userId,
        name: dto.name,
        description: dto.description,
        category: dto.category ?? 'altalanos',
        currency: dto.currency ?? 'HUF',
        introText: dto.introText,
        outroText: dto.outroText,
        itemsJson: dto.itemsJson,
        variables: dto.variables,
        isPublic: dto.isPublic ?? false,
      },
    });
  }

  async findAllTemplates(userId: string) {
    return this.prisma.quoteTemplate.findMany({
      where: { OR: [{ ownerId: userId }, { isPublic: true }] },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTemplate(id: string, userId: string) {
    const t = await this.prisma.quoteTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Template not found');
    if (t.ownerId !== userId && !t.isPublic) throw new ForbiddenException('Access denied');
    return t;
  }

  async updateTemplate(id: string, userId: string, dto: CreateQuoteTemplateDto) {
    const t = await this.prisma.quoteTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Template not found');
    if (t.ownerId !== userId) throw new ForbiddenException('Access denied');

    return this.prisma.quoteTemplate.update({
      where: { id },
      data: {
        name: dto.name, description: dto.description,
        category: dto.category ?? t.category, currency: dto.currency ?? t.currency,
        introText: dto.introText, outroText: dto.outroText,
        itemsJson: dto.itemsJson, variables: dto.variables,
        isPublic: dto.isPublic ?? t.isPublic,
      },
    });
  }

  async deleteTemplate(id: string, userId: string) {
    const t = await this.prisma.quoteTemplate.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Template not found');
    if (t.ownerId !== userId) throw new ForbiddenException('Access denied');
    await this.prisma.quoteTemplate.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── COMMENTS ─────────────────────────────────────────

  async addComment(quoteId: string, author: string, content: string, isOwner: boolean) {
    // Verify quote exists
    const quote = await this.prisma.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new NotFoundException('Quote not found');

    return this.prisma.quoteComment.create({
      data: { quoteId, author, content, isOwner },
    });
  }

  async getComments(quoteId: string) {
    return this.prisma.quoteComment.findMany({
      where: { quoteId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // ─── CALCULATIONS ───────────────────────────────────────

  private calcItemTotal(item: { quantity: number; unitPrice: number; taxRate: number; discount?: number | null; discountType?: string | null; isOptional: boolean }) {
    if (item.isOptional) return { netto: 0, vat: 0, brutto: 0 };
    let netto = item.quantity * item.unitPrice;
    if (item.discount && item.discountType) {
      if (item.discountType === 'percent') netto *= (1 - item.discount / 100);
      else netto -= item.discount;
    }
    netto = Math.max(0, netto);
    const vat = netto * (item.taxRate / 100);
    return { netto, vat, brutto: netto + vat };
  }

  calcQuoteTotal(items: any[], globalDiscount?: number | null, globalDiscountType?: string | null) {
    let totalNetto = 0;
    let totalVat = 0;
    for (const item of items) {
      const t = this.calcItemTotal(item);
      totalNetto += t.netto;
      totalVat += t.vat;
    }
    if (globalDiscount && globalDiscountType) {
      const discountAmount = globalDiscountType === 'percent' ? totalNetto * (globalDiscount / 100) : globalDiscount;
      const ratio = totalNetto > 0 ? (totalNetto - discountAmount) / totalNetto : 0;
      totalNetto = Math.max(0, totalNetto - discountAmount);
      totalVat = Math.max(0, totalVat * ratio);
    }
    return { netto: totalNetto, vat: totalVat, brutto: totalNetto + totalVat };
  }

  // ─── PDF GENERATION ─────────────────────────────────────

  async generateQuotePdf(quote: any): Promise<Buffer> {
    const html = this.generateQuoteHtml(quote);
    return this.pdfService.generatePdf(html, quote.title, {
      logoUrl: quote.owner?.brandLogoUrl,
      companyName: quote.owner?.companyName || quote.owner?.name,
      brandColor: quote.owner?.brandColor,
    });
  }

  generateQuoteHtml(quote: any): string {
    const esc = (s: string) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const formatNum = (n: number) => new Intl.NumberFormat('hu-HU').format(Math.round(n));
    const currencySymbol: Record<string, string> = { HUF: 'Ft', EUR: 'EUR', USD: 'USD' };
    const cur = currencySymbol[quote.currency] ?? quote.currency;

    const labels = quote.language === 'en' ? {
      quote: 'Quotation', client: 'Client', details: 'Quote details',
      id: 'ID', date: 'Date', validUntil: 'Valid until', currency: 'Currency',
      description: 'Description', quantity: 'Quantity', unitPrice: 'Unit price',
      vat: 'VAT', netto: 'Net', brutto: 'Gross',
      netTotal: 'Net total', vatTotal: 'VAT', grossTotal: 'Gross total',
      discount: 'Discount', optional: 'optional', optionalTotal: 'Optional items total',
      notes: 'Notes', generated: 'Generated by', taxNumber: 'Tax number',
    } : {
      quote: 'Ajanlat', client: 'Ugyfel', details: 'Ajanlat reszletek',
      id: 'Azonosito', date: 'Datum', validUntil: 'Ervenyes', currency: 'Penznem',
      description: 'Leiras', quantity: 'Mennyiseg', unitPrice: 'Egysegar',
      vat: 'AFA', netto: 'Netto', brutto: 'Brutto',
      netTotal: 'Netto osszeg', vatTotal: 'AFA', grossTotal: 'Brutto osszeg',
      discount: 'Kedvezmeny', optional: 'opcionalis', optionalTotal: 'Opcionalis tetelek osszege',
      notes: 'Megjegyzes', generated: 'Generalva', taxNumber: 'Adoszam',
    };

    const lang = quote.language === 'en' ? 'en' : 'hu';
    const locale = quote.language === 'en' ? 'en-GB' : 'hu-HU';
    const validUntilSuffix = quote.language === 'en' ? '' : '-ig';

    const brandColor = quote.owner?.brandColor || '#198296';
    const companyName = quote.owner?.companyName || quote.owner?.name || '';
    const companyEmail = quote.owner?.email || '';
    const companyPhone = quote.owner?.phone || '';
    const companyTax = quote.owner?.taxNumber || '';
    const logoUrl = quote.owner?.brandLogoUrl || '';

    // Group items by section
    const sections = new Map<string, any[]>();
    for (const item of (quote.items || [])) {
      const sec = item.sectionName || '';
      if (!sections.has(sec)) sections.set(sec, []);
      sections.get(sec)!.push(item);
    }

    let totalNetto = 0;
    let totalVat = 0;
    let optionalNetto = 0;

    const renderSection = (sectionName: string, items: any[]) => {
      const header = sectionName ? `<tr><td colspan="6" style="padding:12px 8px 6px;font-weight:bold;font-size:14px;color:${brandColor};border-bottom:2px solid ${brandColor};">${esc(sectionName)}</td></tr>` : '';

      const rows = items.map((item: any) => {
        let netto = item.quantity * item.unitPrice;
        if (item.discount && item.discountType) {
          if (item.discountType === 'percent') netto *= (1 - item.discount / 100);
          else netto -= item.discount;
        }
        netto = Math.max(0, netto);
        const vat = netto * (item.taxRate / 100);

        if (item.isOptional) { optionalNetto += netto; }
        else { totalNetto += netto; totalVat += vat; }

        const discountLabel = item.discount && item.discountType
          ? ` <span style="color:#dc2626;font-size:11px;">(${item.discountType === 'percent' ? `-${item.discount}%` : `-${formatNum(item.discount)} ${cur}`})</span>` : '';
        const optLabel = item.isOptional ? ` <span style="background:#fef3c7;color:#92400e;font-size:10px;padding:1px 6px;border-radius:4px;">${labels.optional}</span>` : '';

        return `<tr style="${item.isOptional ? 'opacity:0.7;' : ''}">
          <td style="padding:8px;border-bottom:1px solid #eee;">${esc(item.description)}${optLabel}${discountLabel}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity} ${esc(item.unit)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatNum(item.unitPrice)} ${cur}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.taxRate}%</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatNum(netto)} ${cur}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;font-weight:500;">${formatNum(netto + vat)} ${cur}</td>
        </tr>`;
      }).join('');

      return header + rows;
    };

    const tableContent = Array.from(sections.entries()).map(([name, items]) => renderSection(name, items)).join('');

    let globalDiscountHtml = '';
    if (quote.discount && quote.discountType) {
      const discountAmount = quote.discountType === 'percent' ? totalNetto * (quote.discount / 100) : quote.discount;
      const ratio = totalNetto > 0 ? (totalNetto - discountAmount) / totalNetto : 0;
      totalNetto = Math.max(0, totalNetto - discountAmount);
      totalVat = Math.max(0, totalVat * ratio);
      globalDiscountHtml = `<div class="row" style="color:#dc2626;"><span>${labels.discount} (${quote.discountType === 'percent' ? quote.discount + '%' : formatNum(quote.discount) + ' ' + cur}):</span><span>-${formatNum(discountAmount)} ${cur}</span></div>`;
    }

    const introHtml = quote.introText ? `<div style="margin-bottom:24px;padding:16px;background:#f8f9fa;border-radius:8px;font-size:13px;line-height:1.6;color:#374151;">${esc(quote.introText).replace(/\n/g, '<br>')}</div>` : '';
    const outroHtml = quote.outroText ? `<div style="margin-top:24px;padding:16px;background:#f0fdf4;border-left:3px solid ${brandColor};border-radius:0 8px 8px 0;font-size:13px;line-height:1.6;color:#374151;">${esc(quote.outroText).replace(/\n/g, '<br>')}</div>` : '';

    return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><style>
body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
.header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid ${brandColor}; padding-bottom: 20px; }
.header-left h1 { color: ${brandColor}; font-size: 28px; margin: 0 0 4px; }
.header-left .subtitle { color: #666; font-size: 13px; }
.header-right { text-align: right; font-size: 12px; color: #666; }
.header-right .company { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 4px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
.info-box { background: #f8f9fa; border-radius: 8px; padding: 16px; }
.info-box h3 { margin: 0 0 8px; font-size: 13px; color: ${brandColor}; text-transform: uppercase; letter-spacing: 0.5px; }
.info-box p { margin: 2px 0; font-size: 13px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
th { background: ${brandColor}; color: white; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
td { font-size: 13px; }
.totals { text-align: right; margin-top: 16px; }
.totals .row { display: flex; justify-content: flex-end; gap: 24px; padding: 4px 0; font-size: 14px; }
.totals .total { font-size: 20px; font-weight: bold; color: ${brandColor}; border-top: 2px solid ${brandColor}; padding-top: 8px; margin-top: 8px; }
.notes { background: #fffbeb; border-left: 3px solid #D29B01; padding: 12px 16px; margin-top: 24px; border-radius: 0 8px 8px 0; }
.notes h4 { margin: 0 0 4px; font-size: 13px; color: #D29B01; }
.notes p { margin: 0; font-size: 13px; white-space: pre-wrap; }
.footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 16px; }
@media print { body { padding: 20px; } }
</style></head>
<body>
  <div class="header">
    <div class="header-left">
      ${logoUrl ? `<img src="${esc(logoUrl)}" alt="Logo" style="max-height:50px;margin-bottom:8px;">` : ''}
      <h1>${esc(quote.title)}</h1>
      <div class="subtitle">${quote.quoteNumber ? esc(quote.quoteNumber) + ' · ' : ''}${labels.quote} · ${new Date(quote.createdAt).toLocaleDateString(locale)}${quote.validUntil ? ` · ${labels.validUntil}: ${new Date(quote.validUntil).toLocaleDateString(locale)}${validUntilSuffix}` : ''}</div>
    </div>
    <div class="header-right">
      <div class="company">${esc(companyName)}</div>
      ${companyEmail ? `<div>${esc(companyEmail)}</div>` : ''}
      ${companyPhone ? `<div>${esc(companyPhone)}</div>` : ''}
      ${companyTax ? `<div>${labels.taxNumber}: ${esc(companyTax)}</div>` : ''}
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <h3>${labels.client}</h3>
      <p><strong>${esc(quote.clientName)}</strong></p>
      ${quote.clientCompany ? `<p>${esc(quote.clientCompany)}</p>` : ''}
      <p>${esc(quote.clientEmail)}</p>
      ${quote.clientPhone ? `<p>Tel: ${esc(quote.clientPhone)}</p>` : ''}
      ${quote.clientAddress ? `<p>${esc(quote.clientAddress)}</p>` : ''}
      ${quote.clientTaxNumber ? `<p>${labels.taxNumber}: ${esc(quote.clientTaxNumber)}</p>` : ''}
    </div>
    <div class="info-box">
      <h3>${labels.details}</h3>
      ${quote.quoteNumber ? `<p><strong>${labels.id}:</strong> ${esc(quote.quoteNumber)}</p>` : `<p><strong>${labels.id}:</strong> ${esc(quote.id.substring(0, 8).toUpperCase())}</p>`}
      <p><strong>${labels.date}:</strong> ${new Date(quote.createdAt).toLocaleDateString(locale)}</p>
      ${quote.validUntil ? `<p><strong>${labels.validUntil}:</strong> ${new Date(quote.validUntil).toLocaleDateString(locale)}${validUntilSuffix}</p>` : ''}
      <p><strong>${labels.currency}:</strong> ${quote.currency}</p>
    </div>
  </div>

  ${introHtml}

  <table>
    <thead><tr><th>${labels.description}</th><th style="text-align:center;">${labels.quantity}</th><th style="text-align:right;">${labels.unitPrice}</th><th style="text-align:center;">${labels.vat}</th><th style="text-align:right;">${labels.netto}</th><th style="text-align:right;">${labels.brutto}</th></tr></thead>
    <tbody>${tableContent}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>${labels.netTotal}:</span><span>${formatNum(totalNetto)} ${cur}</span></div>
    ${globalDiscountHtml}
    <div class="row"><span>${labels.vatTotal}:</span><span>${formatNum(totalVat)} ${cur}</span></div>
    <div class="row total"><span>${labels.grossTotal}:</span><span>${formatNum(totalNetto + totalVat)} ${cur}</span></div>
  </div>

  ${optionalNetto > 0 ? `<div style="margin-top:12px;padding:12px 16px;background:#f0f9ff;border-left:3px solid #0284c7;border-radius:0 8px 8px 0;font-size:13px;"><strong style="color:#0284c7;">${labels.optionalTotal}:</strong> ${formatNum(optionalNetto)} ${cur} ${labels.netto.toLowerCase()}</div>` : ''}

  ${outroHtml}

  <div class="footer">${labels.generated}: SzerzodesPortal · ${new Date().toLocaleDateString(locale)}</div>
</body>
</html>`;
  }
}
