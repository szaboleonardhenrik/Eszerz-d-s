import { Controller, Get, Put, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponse } from '../common/api-response';

@Controller('admin/testing')
export class TestingController {
  constructor(private readonly prisma: PrismaService) {}

  private async checkAccess(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true },
    });
    if (!user || !['superadmin', 'employee'].includes(user.role)) {
      throw new ForbiddenException('Nincs jogosultságod');
    }
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAll(@Req() req: any) {
    await this.checkAccess(req.user.userId);
    const results = await this.prisma.testResult.findMany();
    return ApiResponse.ok(results);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':testId')
  async update(
    @Param('testId') testId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
    @Body() body: { status?: string; assignedTo?: string; notes?: string },
  ) {
    const user = await this.checkAccess(req.user.userId);

    const result = await this.prisma.testResult.upsert({
      where: { testId },
      create: {
        testId,
        status: body.status || 'pending',
        assignedTo: body.assignedTo,
        notes: body.notes,
        updatedBy: user.name,
      },
      update: {
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.assignedTo !== undefined ? { assignedTo: body.assignedTo } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        updatedBy: user.name,
      },
    });

    return ApiResponse.ok(result);
  }

  @UseGuards(JwtAuthGuard)
  @Get('team')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getTeam(@Req() req: any) {
    await this.checkAccess(req.user.userId);

    const members = await this.prisma.user.findMany({
      where: { role: { in: ['superadmin', 'employee'] } },
      select: { id: true, name: true, email: true, role: true },
    });
    return ApiResponse.ok(members);
  }
}
