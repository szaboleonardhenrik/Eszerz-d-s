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
        contentHtmlEn: dto.contentHtmlEn ?? null,
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
        ...(dto.contentHtmlEn !== undefined && { contentHtmlEn: dto.contentHtmlEn }),
        ...(dto.variables !== undefined && { variables: JSON.stringify(dto.variables) }),
        ...(dto.legalBasis !== undefined && { legalBasis: dto.legalBasis }),
      },
    });

    // Create template version record
    const lastVersion = await this.prisma.templateVersion.findFirst({
      where: { templateId: id },
      orderBy: { version: 'desc' },
    });
    await this.prisma.templateVersion.create({
      data: {
        templateId: id,
        version: (lastVersion?.version ?? 0) + 1,
        contentHtml: updated.contentHtml,
        changeNote: dto.changeNote ?? `Verzio ${(lastVersion?.version ?? 0) + 1}`,
        createdBy: userId,
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

  async getVersions(templateId: string) {
    return this.prisma.templateVersion.findMany({
      where: { templateId },
      orderBy: { version: 'desc' },
    });
  }

  async revertToVersion(templateId: string, versionId: string, userId: string) {
    const template = await this.prisma.template.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Sablon nem talalhato');
    if (template.ownerId !== userId) throw new ForbiddenException('Nincs jogosultsag');

    const version = await this.prisma.templateVersion.findUnique({ where: { id: versionId } });
    if (!version || version.templateId !== templateId) throw new NotFoundException('Verzio nem talalhato');

    return this.updateTemplate(templateId, userId, { contentHtml: version.contentHtml });
  }

  async renderTemplate(
    templateId: string,
    variables: Record<string, string>,
    options?: { mode?: 'creator' | 'all' },
  ): Promise<string> {
    const template = await this.findOne(templateId);
    let html = template.contentHtml;
    const templateVars: any[] = Array.isArray(template.variables) ? template.variables : [];
    const mode = options?.mode ?? 'all';

    if (mode === 'creator') {
      // Build a set of signer variable names
      const signerVarNames = new Set(
        templateVars
          .filter((v: any) => v.filledBy === 'signer')
          .map((v: any) => v.name),
      );

      // Replace creator fields normally
      for (const [key, value] of Object.entries(variables)) {
        if (!signerVarNames.has(key)) {
          const escapedValue = this.escapeHtml(value);
          html = html.replaceAll(`{{${key}}}`, escapedValue);
          html = html.replaceAll(`!!${key}!!`, escapedValue);
        }
      }

      // Replace signer fields with styled placeholder spans
      for (const v of templateVars) {
        if (v.filledBy === 'signer') {
          const placeholder = `<span class="signer-field" data-var="${v.name}" style="background:#FEF3C7;padding:2px 8px;border-radius:4px;border:1px dashed #D97706;color:#92400E;">[${v.label} - aláíró tölti ki]</span>`;
          html = html.replaceAll(`{{${v.name}}}`, placeholder);
          html = html.replaceAll(`!!${v.name}!!`, placeholder);
        }
      }

      // Handle any remaining {{...}} placeholders that might be signer vars not in the variables dict
      const remainingPattern = /\{\{(\w+)\}\}/g;
      html = html.replace(remainingPattern, (match, varName) => {
        // If this var is in the template vars as a signer field, replace with placeholder
        const tplVar = templateVars.find((v: any) => v.name === varName && v.filledBy === 'signer');
        if (tplVar) {
          return `<span class="signer-field" data-var="${tplVar.name}" style="background:#FEF3C7;padding:2px 8px;border-radius:4px;border:1px dashed #D97706;color:#92400E;">[${tplVar.label} - aláíró tölti ki]</span>`;
        }
        return match;
      });
    } else {
      // 'all' mode - replace everything as before
      for (const [key, value] of Object.entries(variables)) {
        const escapedValue = this.escapeHtml(value);
        html = html.replaceAll(`{{${key}}}`, escapedValue);
        html = html.replaceAll(`!!${key}!!`, escapedValue);
      }
    }

    return html;
  }

  renderSignerFields(
    html: string,
    signerVariables: Record<string, string>,
    templateVars: any[],
  ): string {
    for (const [key, value] of Object.entries(signerVariables)) {
      const escapedValue = this.escapeHtml(value);
      // Replace placeholder spans
      const placeholderRegex = new RegExp(
        `<span class="signer-field" data-var="${key}"[^>]*>\\[.*?\\]</span>`,
        'g',
      );
      html = html.replace(placeholderRegex, escapedValue);
      // Also handle raw {{key}} placeholders
      html = html.replaceAll(`{{${key}}}`, escapedValue);
      html = html.replaceAll(`!!${key}!!`, escapedValue);
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
