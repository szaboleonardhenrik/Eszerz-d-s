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
