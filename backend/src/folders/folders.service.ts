import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FoldersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUser(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId },
      include: {
        children: true,
        _count: { select: { contracts: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(userId: string, dto: { name: string; color?: string; parentId?: string }) {
    if (dto.parentId) {
      const parent = await this.prisma.folder.findUnique({ where: { id: dto.parentId } });
      if (!parent || parent.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    }
    return this.prisma.folder.create({
      data: {
        name: dto.name,
        color: dto.color ?? '#6B7280',
        userId,
        parentId: dto.parentId ?? null,
      },
    });
  }

  async update(folderId: string, userId: string, dto: { name?: string; color?: string }) {
    const folder = await this.prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) throw new NotFoundException('Mappa nem található');
    if (folder.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    return this.prisma.folder.update({ where: { id: folderId }, data: dto });
  }

  async delete(folderId: string, userId: string) {
    const folder = await this.prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) throw new NotFoundException('Mappa nem található');
    if (folder.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');

    // Set contracts' folderId to null before deleting the folder
    await this.prisma.contract.updateMany({
      where: { folderId },
      data: { folderId: null },
    });

    await this.prisma.folder.delete({ where: { id: folderId } });
    return { deleted: true };
  }

  async moveContract(contractId: string, folderId: string | null, userId: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract || contract.ownerId !== userId) throw new ForbiddenException('Nincs jogosultságod');

    if (folderId) {
      const folder = await this.prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder || folder.userId !== userId) throw new ForbiddenException('Nincs jogosultságod');
    }

    return this.prisma.contract.update({
      where: { id: contractId },
      data: { folderId },
    });
  }
}
