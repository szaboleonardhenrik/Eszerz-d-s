import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.tag.findMany({
      where: { userId },
      include: { contracts: { select: { contractId: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, name: string, color?: string) {
    return this.prisma.tag.create({
      data: { name, color: color ?? '#6B7280', userId },
    });
  }

  async update(tagId: string, userId: string, data: { name?: string; color?: string }) {
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) throw new NotFoundException('Címke nem található');
    if (tag.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    return this.prisma.tag.update({ where: { id: tagId }, data });
  }

  async delete(tagId: string, userId: string) {
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag) throw new NotFoundException('Címke nem található');
    if (tag.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    await this.prisma.tag.delete({ where: { id: tagId } });
    return { deleted: true };
  }

  async tagContract(contractId: string, tagId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract || contract.ownerId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag || tag.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');

    return this.prisma.contractTag.upsert({
      where: { contractId_tagId: { contractId, tagId } },
      create: { contractId, tagId },
      update: {},
    });
  }

  async untagContract(contractId: string, tagId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract || contract.ownerId !== userId) throw new ForbiddenException('Nincs jogosultságod');

    await this.prisma.contractTag.deleteMany({ where: { contractId, tagId } });
    return { deleted: true };
  }
}
