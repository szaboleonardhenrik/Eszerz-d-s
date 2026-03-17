import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateClauseDto {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  teamId?: string;
}

type UpdateClauseDto = Partial<CreateClauseDto>;

@Injectable()
export class ClausesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, category?: string, search?: string) {
    const where: any = {
      OR: [
        { userId },
        { isDefault: true },
      ],
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content: { contains: search, mode: 'insensitive' } },
            { tags: { hasSome: [search] } },
          ],
        },
      ];
    }

    return this.prisma.clause.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { usageCount: 'desc' }, { title: 'asc' }],
    });
  }

  async findOne(id: string, userId: string) {
    const clause = await this.prisma.clause.findUnique({ where: { id } });
    if (!clause) throw new NotFoundException('Záradék nem található');
    if (!clause.isDefault && clause.userId !== userId) {
      throw new ForbiddenException('Nincs jogosultságod');
    }
    return clause;
  }

  async create(userId: string, dto: CreateClauseDto) {
    return this.prisma.clause.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        category: dto.category,
        tags: dto.tags ?? [],
        teamId: dto.teamId,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateClauseDto) {
    const clause = await this.prisma.clause.findUnique({ where: { id } });
    if (!clause) throw new NotFoundException('Záradék nem található');
    if (clause.isDefault) throw new ForbiddenException('Alapértelmezett záradék nem módosítható');
    if (clause.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    return this.prisma.clause.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string) {
    const clause = await this.prisma.clause.findUnique({ where: { id } });
    if (!clause) throw new NotFoundException('Záradék nem található');
    if (clause.isDefault) throw new ForbiddenException('Alapértelmezett záradék nem törölhető');
    if (clause.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    await this.prisma.clause.delete({ where: { id } });
    return { deleted: true };
  }

  async incrementUsage(id: string, userId: string) {
    const clause = await this.prisma.clause.findUnique({ where: { id } });
    if (!clause) throw new NotFoundException('Záradék nem található');
    return this.prisma.clause.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });
  }

  async getCategories(userId: string) {
    const clauses = await this.prisma.clause.findMany({
      where: {
        OR: [{ userId }, { isDefault: true }],
      },
      select: { category: true },
      distinct: ['category'],
    });
    return clauses.map((c) => c.category);
  }
}
