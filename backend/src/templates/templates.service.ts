import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(category?: string, userId?: string) {
    const where: any = {
      OR: [
        { isPublic: true },
        ...(userId ? [{ ownerId: userId }] : []),
      ],
    };
    if (category) {
      where.category = category;
    }
    const templates = await this.prisma.template.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return templates.map((t) => ({
      ...t,
      variables: typeof t.variables === 'string' ? JSON.parse(t.variables) : t.variables,
    }));
  }

  async createTemplate(userId: string, dto: CreateTemplateDto) {
    const template = await this.prisma.template.create({
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description ?? null,
        contentHtml: dto.contentHtml,
        variables: JSON.stringify(dto.variables ?? []),
        legalBasis: dto.legalBasis ?? null,
        isPublic: false,
        ownerId: userId,
      },
    });
    return {
      ...template,
      variables: typeof template.variables === 'string' ? JSON.parse(template.variables) : template.variables,
    };
  }

  async updateTemplate(id: string, userId: string, dto: Partial<CreateTemplateDto>) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException('A sablon nem található');
    }
    if (template.ownerId !== userId) {
      throw new ForbiddenException('Csak a saját sablonjaidat szerkesztheted');
    }
    const updated = await this.prisma.template.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.contentHtml !== undefined && { contentHtml: dto.contentHtml }),
        ...(dto.variables !== undefined && { variables: JSON.stringify(dto.variables) }),
        ...(dto.legalBasis !== undefined && { legalBasis: dto.legalBasis }),
      },
    });
    return {
      ...updated,
      variables: typeof updated.variables === 'string' ? JSON.parse(updated.variables) : updated.variables,
    };
  }

  async deleteTemplate(id: string, userId: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException('A sablon nem található');
    }
    if (template.isPublic) {
      throw new ForbiddenException('Rendszersablont nem lehet törölni');
    }
    if (template.ownerId !== userId) {
      throw new ForbiddenException('Csak a saját sablonjaidat törölheted');
    }
    await this.prisma.template.delete({ where: { id } });
    return { deleted: true };
  }

  async findOne(id: string) {
    const template = await this.prisma.template.findUnique({ where: { id } });
    if (!template) {
      throw new NotFoundException('A sablon nem található');
    }
    return {
      ...template,
      variables: typeof template.variables === 'string' ? JSON.parse(template.variables) : template.variables,
    };
  }

  async findByUser(userId: string) {
    return this.prisma.template.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async renderTemplate(
    templateId: string,
    variables: Record<string, string>,
  ): Promise<string> {
    const template = await this.findOne(templateId);
    let html = template.contentHtml;

    for (const [key, value] of Object.entries(variables)) {
      const escapedValue = this.escapeHtml(value);
      html = html.replaceAll(`{{${key}}}`, escapedValue);
    }

    return html;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
