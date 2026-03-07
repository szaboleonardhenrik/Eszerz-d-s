import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateQuoteDto) {
    return this.prisma.quote.create({
      data: {
        ownerId: userId,
        title: dto.title,
        clientName: dto.clientName,
        clientEmail: dto.clientEmail,
        clientCompany: dto.clientCompany,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        currency: dto.currency ?? 'HUF',
        notes: dto.notes,
        items: {
          create: dto.items.map((item) => ({
            description: item.description,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice,
            unit: item.unit ?? 'db',
            taxRate: item.taxRate ?? 27,
          })),
        },
      },
      include: { items: true },
    });
  }

  async findAllByUser(
    userId: string,
    status?: string,
    search?: string,
    page = 1,
    limit = 20,
  ) {
    const where: any = { ownerId: userId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { clientName: { contains: search, mode: 'insensitive' } },
        { clientEmail: { contains: search, mode: 'insensitive' } },
        { clientCompany: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      quotes,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (quote.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return quote;
  }

  async update(id: string, userId: string, dto: CreateQuoteDto) {
    const quote = await this.findOne(id, userId);

    // Delete old items and create new ones in a transaction
    return this.prisma.$transaction(async (tx) => {
      await tx.quoteItem.deleteMany({ where: { quoteId: id } });

      return tx.quote.update({
        where: { id },
        data: {
          title: dto.title,
          clientName: dto.clientName,
          clientEmail: dto.clientEmail,
          clientCompany: dto.clientCompany,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          currency: dto.currency ?? quote.currency,
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              description: item.description,
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice,
              unit: item.unit ?? 'db',
              taxRate: item.taxRate ?? 27,
            })),
          },
        },
        include: { items: true },
      });
    });
  }

  async delete(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.quote.delete({ where: { id } });
    return { deleted: true };
  }

  async updateStatus(id: string, userId: string, status: string) {
    await this.findOne(id, userId);

    return this.prisma.quote.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
  }

  async getStats(userId: string) {
    const [draft, sent, accepted, declined, expired] = await Promise.all([
      this.prisma.quote.count({ where: { ownerId: userId, status: 'draft' } }),
      this.prisma.quote.count({ where: { ownerId: userId, status: 'sent' } }),
      this.prisma.quote.count({
        where: { ownerId: userId, status: 'accepted' },
      }),
      this.prisma.quote.count({
        where: { ownerId: userId, status: 'declined' },
      }),
      this.prisma.quote.count({
        where: { ownerId: userId, status: 'expired' },
      }),
    ]);

    // Calculate total revenue from accepted quotes
    const acceptedQuotes = await this.prisma.quote.findMany({
      where: { ownerId: userId, status: 'accepted' },
      include: { items: true },
    });

    const totalRevenue = acceptedQuotes.reduce((sum, quote) => {
      const quoteTotal = quote.items.reduce(
        (itemSum, item) => itemSum + item.quantity * item.unitPrice,
        0,
      );
      return sum + quoteTotal;
    }, 0);

    return {
      draft,
      sent,
      accepted,
      declined,
      expired,
      total: draft + sent + accepted + declined + expired,
      totalRevenue,
    };
  }

  generateQuoteHtml(quote: any): string {
    const esc = (s: string) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const formatNum = (n: number) => new Intl.NumberFormat('hu-HU').format(Math.round(n));
    const currencySymbol: Record<string, string> = { HUF: 'Ft', EUR: 'EUR', USD: 'USD' };
    const cur = currencySymbol[quote.currency] ?? quote.currency;

    let totalNetto = 0;
    let totalVat = 0;

    const rows = (quote.items || []).map((item: any) => {
      const netto = item.quantity * item.unitPrice;
      const vat = netto * (item.taxRate / 100);
      totalNetto += netto;
      totalVat += vat;
      return `<tr>
      <td style="padding:8px;border-bottom:1px solid #eee;">${esc(item.description)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity} ${esc(item.unit)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatNum(item.unitPrice)} ${cur}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.taxRate}%</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatNum(netto + vat)} ${cur}</td>
    </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="hu">
<head><meta charset="UTF-8"><style>
body { font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 40px; }
h1 { color: #198296; font-size: 24px; margin-bottom: 4px; }
.meta { color: #666; font-size: 13px; margin-bottom: 30px; }
.client-box { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
.client-box h3 { margin: 0 0 8px; font-size: 14px; color: #198296; }
.client-box p { margin: 2px 0; font-size: 13px; }
table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
th { background: #198296; color: white; padding: 10px 8px; text-align: left; font-size: 13px; }
td { font-size: 13px; }
.totals { text-align: right; margin-top: 16px; }
.totals .row { display: flex; justify-content: flex-end; gap: 24px; padding: 4px 0; font-size: 14px; }
.totals .total { font-size: 18px; font-weight: bold; color: #198296; border-top: 2px solid #198296; padding-top: 8px; margin-top: 8px; }
.notes { background: #fffbeb; border-left: 3px solid #D29B01; padding: 12px 16px; margin-top: 24px; border-radius: 0 8px 8px 0; }
.notes h4 { margin: 0 0 4px; font-size: 13px; color: #D29B01; }
.notes p { margin: 0; font-size: 13px; }
.footer { margin-top: 40px; text-align: center; color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 16px; }
</style></head>
<body>
  <h1>${esc(quote.title)}</h1>
  <div class="meta">Ajánlat · ${new Date(quote.createdAt).toLocaleDateString('hu-HU')}${quote.validUntil ? ` · Érvényes: ${new Date(quote.validUntil).toLocaleDateString('hu-HU')}-ig` : ''}</div>

  <div class="client-box">
    <h3>Ügyfél</h3>
    <p><strong>${esc(quote.clientName)}</strong></p>
    <p>${esc(quote.clientEmail)}</p>
    ${quote.clientCompany ? `<p>${esc(quote.clientCompany)}</p>` : ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Leírás</th>
        <th style="text-align:center;">Mennyiség</th>
        <th style="text-align:right;">Egységár</th>
        <th style="text-align:center;">ÁFA</th>
        <th style="text-align:right;">Összeg</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <div class="row"><span>Nettó összeg:</span><span>${formatNum(totalNetto)} ${cur}</span></div>
    <div class="row"><span>ÁFA:</span><span>${formatNum(totalVat)} ${cur}</span></div>
    <div class="row total"><span>Bruttó összeg:</span><span>${formatNum(totalNetto + totalVat)} ${cur}</span></div>
  </div>

  ${quote.notes ? `<div class="notes"><h4>Megjegyzés</h4><p>${esc(quote.notes)}</p></div>` : ''}

  <div class="footer">
    Generálva: SzerződésPortál · ${new Date().toLocaleDateString('hu-HU')}
  </div>
</body>
</html>`;
  }

  async duplicate(id: string, userId: string) {
    const original = await this.findOne(id, userId);

    return this.prisma.quote.create({
      data: {
        ownerId: userId,
        title: `${original.title} (masolat)`,
        clientName: original.clientName,
        clientEmail: original.clientEmail,
        clientCompany: original.clientCompany,
        validUntil: null,
        currency: original.currency,
        notes: original.notes,
        status: 'draft',
        items: {
          create: original.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.unit,
            taxRate: item.taxRate,
          })),
        },
      },
      include: { items: true },
    });
  }
}
