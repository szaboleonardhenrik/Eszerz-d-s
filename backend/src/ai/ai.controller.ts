import { Controller, Post, Param, UseGuards, Req } from '@nestjs/common';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('analyze/:contractId')
  async analyzeContract(
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    // Verify ownership
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, ownerId: req.user.userId },
    });

    if (!contract) {
      return ApiResponse.error('NOT_FOUND', 'Szerződés nem található.');
    }

    try {
      const analysis = await this.aiService.analyzeContract(
        contract.contentHtml,
      );
      return ApiResponse.ok(analysis);
    } catch (error: any) {
      if (error.message === 'AI szolgáltatás nincs konfigurálva') {
        return ApiResponse.error(
          'AI_NOT_CONFIGURED',
          'AI elemzés jelenleg nem elérhető. Állítsd be az ANTHROPIC_API_KEY-t.',
        );
      }
      return ApiResponse.error('AI_ERROR', 'Hiba az AI elemzés során.');
    }
  }
}
