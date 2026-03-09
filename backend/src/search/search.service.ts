import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(query: string, userId: string) {
    const searchTerm = `%${query}%`;

    const [contracts, contacts, templates] = await Promise.all([
      this.prisma.contract.findMany({
        where: {
          userId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { partyAName: { contains: query, mode: 'insensitive' } },
            { partyBName: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          partyAName: true,
          partyBName: true,
          createdAt: true,
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.contact.findMany({
        where: {
          userId,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { company: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.template.findMany({
        where: {
          OR: [
            { userId },
            { isPublic: true },
          ],
          name: { contains: query, mode: 'insensitive' },
        },
        select: {
          id: true,
          name: true,
          category: true,
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return { contracts, contacts, templates };
  }
}
