import { Controller, Get, Post, Body, Query, Req, UseGuards } from '@nestjs/common';
import { CreditsService, CREDIT_PACKS } from './credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('credits')
@UseGuards(JwtAuthGuard)
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance')
  async getBalance(@Req() req: any) {
    const balance = await this.creditsService.getBalance(req.user.userId);
    return ApiResponse.ok({ balance });
  }

  @Get('history')
  async getHistory(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(50, Math.max(1, parseInt(limit || '20', 10) || 20));
    const result = await this.creditsService.getHistory(req.user.userId, p, l);
    return ApiResponse.ok(result);
  }

  @Get('packs')
  async getPacks() {
    return ApiResponse.ok({ packs: CREDIT_PACKS });
  }

  @Post('purchase')
  async purchasePack(@Req() req: any, @Body() body: { packId: string }) {
    const result = await this.creditsService.purchasePack(req.user.userId, body.packId);
    return ApiResponse.ok(result);
  }
}
