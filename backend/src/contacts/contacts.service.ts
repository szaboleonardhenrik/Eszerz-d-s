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
}
