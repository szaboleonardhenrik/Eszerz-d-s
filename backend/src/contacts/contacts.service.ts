import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateContactDto {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  taxNumber?: string;
  address?: string;
  notes?: string;
  group?: string;
}

type UpdateContactDto = Partial<CreateContactDto>;

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string, search?: string, group?: string) {
    const where: any = { userId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (group) {
      where.group = group;
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(contactId: string, userId: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException('Partner nem található');
    if (contact.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    return contact;
  }

  async create(userId: string, dto: CreateContactDto) {
    return this.prisma.contact.create({
      data: {
        userId,
        name: dto.name,
        email: dto.email,
        company: dto.company,
        phone: dto.phone,
        taxNumber: dto.taxNumber,
        address: dto.address,
        notes: dto.notes,
        group: dto.group,
      },
    });
  }

  async update(contactId: string, userId: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException('Partner nem található');
    if (contact.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    return this.prisma.contact.update({ where: { id: contactId }, data: dto });
  }

  async delete(contactId: string, userId: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException('Partner nem található');
    if (contact.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    await this.prisma.contact.delete({ where: { id: contactId } });
    return { deleted: true };
  }

  async upsertFromSigner(userId: string, signer: { name: string; email: string; role?: string }) {
    const existing = await this.prisma.contact.findUnique({
      where: { userId_email: { userId, email: signer.email } },
    });

    if (existing) {
      if (existing.name !== signer.name) {
        await this.prisma.contact.update({
          where: { id: existing.id },
          data: { name: signer.name },
        });
      }
      return existing;
    }

    return this.prisma.contact.create({
      data: {
        userId,
        name: signer.name,
        email: signer.email,
        notes: signer.role ? `Szerepkör: ${signer.role}` : undefined,
      },
    });
  }

  async findOneWithContracts(contactId: string, userId: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException('Partner nem található');
    if (contact.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');

    const contracts = await this.prisma.contract.findMany({
      where: {
        ownerId: userId,
        signers: { some: { email: contact.email } },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        signers: {
          where: { email: contact.email },
          select: {
            status: true,
            signedAt: true,
            signatureMethod: true,
          },
        },
      },
    });

    return { ...contact, contracts };
  }

  async getTimeline(contactId: string, userId: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException('Partner nem található');
    if (contact.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');

    // Get all audit logs related to this partner's email
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        contract: { ownerId: userId },
        OR: [
          { signer: { email: contact.email } },
          {
            eventType: { in: ['contract_created', 'email_sent'] },
            contract: { signers: { some: { email: contact.email } } },
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        contract: { select: { title: true } },
        signer: { select: { name: true, email: true } },
      },
    });

    return auditLogs;
  }

  async findAllWithStats(userId: string, search?: string, group?: string) {
    const where: any = { userId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (group) {
      where.group = group;
    }

    const contacts = await this.prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const contactsWithStats = await Promise.all(
      contacts.map(async (c) => {
        const contractCount = await this.prisma.contract.count({
          where: {
            ownerId: userId,
            signers: { some: { email: c.email } },
          },
        });
        const lastSigned = await this.prisma.signer.findFirst({
          where: { email: c.email, status: 'signed', contract: { ownerId: userId } },
          orderBy: { signedAt: 'desc' },
          select: { signedAt: true },
        });
        return {
          ...c,
          contractCount,
          lastSignedAt: lastSigned?.signedAt ?? null,
        };
      }),
    );

    return contactsWithStats;
  }

  async exportContacts(userId: string, format: 'csv' | 'json', group?: string) {
    const contacts = await this.findAllWithStats(userId, undefined, group);

    const rows = contacts.map((c) => ({
      nev: c.name,
      email: c.email,
      ceg: c.company ?? '',
      telefon: c.phone ?? '',
      adoszam: c.taxNumber ?? '',
      cim: c.address ?? '',
      csoport: c.group ?? '',
      szerzodesek: String(c.contractCount),
      utolsoAlairas: c.lastSignedAt
        ? new Date(c.lastSignedAt).toLocaleDateString('hu-HU')
        : '-',
      megjegyzes: c.notes ?? '',
    }));

    if (format === 'json') {
      return { contentType: 'application/json', data: JSON.stringify(rows, null, 2) };
    }

    const BOM = '\uFEFF';
    const headers = ['Név', 'Email', 'Cég', 'Telefon', 'Adószám', 'Cím', 'Csoport', 'Szerződések', 'Utolsó aláírás', 'Megjegyzés'];
    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        [r.nev, r.email, r.ceg, r.telefon, r.adoszam, r.cim, r.csoport, r.szerzodesek, r.utolsoAlairas, r.megjegyzes]
          .map((v) => `"${v.replace(/"/g, '""')}"`)
          .join(','),
      ),
    ];
    return { contentType: 'text/csv', data: BOM + csvLines.join('\r\n') };
  }

  async getGroups(userId: string) {
    const contacts = await this.prisma.contact.findMany({
      where: { userId, group: { not: null } },
      select: { group: true },
      distinct: ['group'],
    });
    return contacts.map((c) => c.group).filter(Boolean);
  }
}
