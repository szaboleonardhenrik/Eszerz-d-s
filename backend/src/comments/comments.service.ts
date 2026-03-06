import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getByContract(contractId: string, userId: string) {
    // Verify the user owns this contract
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Szerződés nem található');
    }

    if (contract.ownerId !== userId) {
      throw new ForbiddenException('Nincs jogosultságod');
    }

    return this.prisma.comment.findMany({
      where: { contractId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(contractId: string, userId: string, content: string) {
    // Verify the user owns this contract
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new NotFoundException('Szerződés nem található');
    }

    if (contract.ownerId !== userId) {
      throw new ForbiddenException('Nincs jogosultságod');
    }

    return this.prisma.comment.create({
      data: {
        contractId,
        userId,
        content,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Megjegyzés nem található');
    }

    if (comment.userId !== userId) {
      throw new ForbiddenException('Csak saját megjegyzést törölhetsz');
    }

    await this.prisma.comment.delete({ where: { id: commentId } });

    return { deleted: true };
  }
}
