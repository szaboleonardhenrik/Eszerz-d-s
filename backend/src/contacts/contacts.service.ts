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
}

type UpdateContactDto = Partial<CreateContactDto>;

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string, search?: string) {
    const where: any = { userId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(contactId: string, userId: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException('Kontakt nem található');
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
      },
    });
  }

  async update(contactId: string, userId: string, dto: UpdateContactDto) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException('Kontakt nem található');
    if (contact.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    return this.prisma.contact.update({ where: { id: contactId }, data: dto });
  }

  async delete(contactId: string, userId: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) throw new NotFoundException('Kontakt nem található');
    if (contact.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    await this.prisma.contact.delete({ where: { id: contactId } });
    return { deleted: true };
  }

  async upsertFromSigner(userId: string, signer: { name: string; email: string; role?: string }) {
    const existing = await this.prisma.contact.findUnique({
      where: { userId_email: { userId, email: signer.email } },
    });

    if (existing) {
      // Update name if it was placeholder
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
        signers: {
          some: { email: contact.email },
        },
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

  async findAllWithStats(userId: string, search?: string) {
    const where: any = { userId };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
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
}
