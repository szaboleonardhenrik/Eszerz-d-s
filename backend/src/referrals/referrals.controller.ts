import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('code')
  @UseGuards(JwtAuthGuard)
  async getCode(@Req() req: any) {
    const result = await this.referralsService.getOrCreateCode(req.user.userId);
    return ApiResponse.ok(result);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getMyReferrals(@Req() req: any) {
    const result = await this.referralsService.getMyReferrals(req.user.userId);
    return ApiResponse.ok(result);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getStats(@Req() req: any) {
    const result = await this.referralsService.getStats(req.user.userId);
    return ApiResponse.ok(result);
  }

  @Post('validate')
  async validateCode(@Body() body: { code: string }) {
    const result = await this.referralsService.validateCode(body.code);
    return ApiResponse.ok(result);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  async applyReferral(@Body() body: { code: string }, @Req() req: any) {
    const result = await this.referralsService.applyReferral(
      body.code,
      req.user.userId,
    );
    return ApiResponse.ok(result);
  }
}
