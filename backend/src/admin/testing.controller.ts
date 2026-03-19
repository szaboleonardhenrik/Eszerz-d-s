import { Controller, Get, Put, Post, Delete, Param, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ApiResponse } from '../common/api-response';
import { randomUUID } from 'crypto';

@Controller('admin/testing')
export class TestingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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

  // ─── Sections ───

  @UseGuards(JwtAuthGuard)
  @Get('sections')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getSections(@Req() req: any) {
    await this.checkAccess(req.user.userId);
    const sections = await this.prisma.testSection.findMany({
      include: { cases: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { sortOrder: 'asc' },
    });
    return ApiResponse.ok(sections);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sections')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createSection(
    @Req() req: any,
    @Body() body: { title: string; icon?: string; category?: string },
  ) {
    const user = await this.checkAccess(req.user.userId);
    const maxOrder = await this.prisma.testSection.aggregate({ _max: { sortOrder: true } });
    const section = await this.prisma.testSection.create({
      data: {
        title: body.title,
        icon: body.icon || '📋',
        category: body.category || 'General',
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        createdBy: user.name,
      },
      include: { cases: true },
    });
    return ApiResponse.ok(section);
  }

  @UseGuards(JwtAuthGuard)
  @Put('sections/:id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateSection(
    @Param('id') id: string,
    @Req() req: any,
    @Body() body: { title?: string; icon?: string; category?: string; sortOrder?: number },
  ) {
    await this.checkAccess(req.user.userId);
    const section = await this.prisma.testSection.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.category !== undefined ? { category: body.category } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
      },
      include: { cases: { orderBy: { sortOrder: 'asc' } } },
    });
    return ApiResponse.ok(section);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sections/:id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteSection(@Param('id') id: string, @Req() req: any) {
    await this.checkAccess(req.user.userId);
    await this.prisma.testSection.delete({ where: { id } });
    return ApiResponse.ok({ deleted: true });
  }

  // ─── Cases ───

  @UseGuards(JwtAuthGuard)
  @Post('cases')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createCase(
    @Req() req: any,
    @Body() body: { sectionId: string; title: string; description?: string; steps?: string[]; expected?: string; priority?: string },
  ) {
    const user = await this.checkAccess(req.user.userId);
    const maxOrder = await this.prisma.testCase.aggregate({
      where: { sectionId: body.sectionId },
      _max: { sortOrder: true },
    });
    const tc = await this.prisma.testCase.create({
      data: {
        sectionId: body.sectionId,
        title: body.title,
        description: body.description || '',
        steps: body.steps || [],
        expected: body.expected || '',
        priority: body.priority || 'medium',
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
        createdBy: user.name,
      },
    });
    return ApiResponse.ok(tc);
  }

  @UseGuards(JwtAuthGuard)
  @Put('cases/:id')
  async updateCase(
    @Param('id') id: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Req() req: any,
    @Body() body: {
      title?: string; description?: string; steps?: string[]; expected?: string;
      priority?: string; sortOrder?: number; status?: string; assignedTo?: string;
      notes?: string; screenshotBase64?: string;
    },
  ) {
    const user = await this.checkAccess(req.user.userId);

    let screenshotUrl: string | undefined;
    if (body.screenshotBase64) {
      const buf = Buffer.from(body.screenshotBase64.replace(/^data:image\/\w+;base64,/, ''), 'base64');
      const key = `test-screenshots/${id}/${randomUUID()}.png`;
      await this.storageService.uploadImage(key, buf);
      screenshotUrl = key;
    }

    const existing = screenshotUrl
      ? await this.prisma.testCase.findUnique({ where: { id }, select: { screenshots: true } })
      : null;

    const tc = await this.prisma.testCase.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.steps !== undefined ? { steps: body.steps } : {}),
        ...(body.expected !== undefined ? { expected: body.expected } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.sortOrder !== undefined ? { sortOrder: body.sortOrder } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.assignedTo !== undefined ? { assignedTo: body.assignedTo } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(screenshotUrl ? { screenshots: [...(existing?.screenshots || []), screenshotUrl] } : {}),
        updatedBy: user.name,
      },
    });
    return ApiResponse.ok(tc);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cases/:id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async deleteCase(@Param('id') id: string, @Req() req: any) {
    await this.checkAccess(req.user.userId);
    await this.prisma.testCase.delete({ where: { id } });
    return ApiResponse.ok({ deleted: true });
  }

  // ─── Utils ───

  @UseGuards(JwtAuthGuard)
  @Get('screenshot')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getScreenshot(@Req() req: any) {
    await this.checkAccess(req.user.userId);
    const key = req.query.key as string;
    if (!key) throw new ForbiddenException('Missing key');
    const url = await this.storageService.getSignedDownloadUrl(key);
    return ApiResponse.ok({ url });
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
