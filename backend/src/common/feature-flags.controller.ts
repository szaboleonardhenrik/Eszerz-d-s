import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from './api-response';

@Controller('feature-flags')
@UseGuards(JwtAuthGuard)
export class FeatureFlagsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getMyFlags(@Req() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { subscriptionTier: true, role: true },
    });

    const allFlags = await this.prisma.featureFlag.findMany();
    const tierOrder = ['free', 'starter', 'medium', 'premium', 'enterprise'];
    const userTierIdx = tierOrder.indexOf(user?.subscriptionTier ?? 'free');
    const isAdmin = user && ['superadmin', 'employee'].includes(user.role);

    const flags: Record<string, boolean> = {};
    for (const f of allFlags) {
      if (!f.enabled) {
        flags[f.key] = false;
      } else if (isAdmin || !f.minTier) {
        flags[f.key] = true;
      } else {
        flags[f.key] = tierOrder.indexOf(f.minTier) <= userTierIdx;
      }
    }

    return ApiResponse.ok(flags);
  }
}
