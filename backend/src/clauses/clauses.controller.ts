import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ClausesService } from './clauses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('clauses')
@UseGuards(JwtAuthGuard)
export class ClausesController {
  constructor(private readonly clausesService: ClausesService) {}

  @Get()
  async findAll(
    @Query('category') category: string,
    @Query('search') search: string,
    @Req() req: any,
  ) {
    const clauses = await this.clausesService.findAll(
      req.user.userId,
      category || undefined,
      search || undefined,
    );
    return ApiResponse.ok(clauses);
  }

  @Get('categories')
  async getCategories(@Req() req: any) {
    const categories = await this.clausesService.getCategories(req.user.userId);
    return ApiResponse.ok(categories);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const clause = await this.clausesService.findOne(id, req.user.userId);
    return ApiResponse.ok(clause);
  }

  @Post()
  async create(
    @Body() body: { title: string; content: string; category: string; tags?: string[]; teamId?: string },
    @Req() req: any,
  ) {
    const clause = await this.clausesService.create(req.user.userId, body);
    return ApiResponse.ok(clause);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { title?: string; content?: string; category?: string; tags?: string[] },
    @Req() req: any,
  ) {
    const clause = await this.clausesService.update(id, req.user.userId, body);
    return ApiResponse.ok(clause);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.clausesService.remove(id, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Post(':id/use')
  async incrementUsage(@Param('id') id: string, @Req() req: any) {
    const clause = await this.clausesService.incrementUsage(id, req.user.userId);
    return ApiResponse.ok(clause);
  }
}
