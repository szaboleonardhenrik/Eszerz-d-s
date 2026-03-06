import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get()
  async findAll(@Query('category') category?: string, @Req() req?: any) {
    const userId = req?.user?.userId;
    const templates = await this.templatesService.findAll(category, userId);
    return ApiResponse.ok(templates);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const template = await this.templatesService.findOne(id);
    return ApiResponse.ok(template);
  }

  @Get(':id/preview')
  async preview(@Param('id') id: string) {
    const template = await this.templatesService.findOne(id);
    return ApiResponse.ok({
      name: template.name,
      category: template.category,
      description: template.description,
      contentHtml: template.contentHtml,
      contentHtmlEn: template.contentHtmlEn,
      variables: template.variables,
      legalBasis: template.legalBasis,
    });
  }

  @Post()
  async create(@Body() dto: CreateTemplateDto, @Req() req: any) {
    const template = await this.templatesService.createTemplate(req.user.userId, dto);
    return ApiResponse.ok(template);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateTemplateDto>, @Req() req: any) {
    const template = await this.templatesService.updateTemplate(id, req.user.userId, dto);
    return ApiResponse.ok(template);
  }

  @Get(':id/versions')
  async getVersions(@Param('id') id: string, @Req() req: any) {
    const versions = await this.templatesService.getVersions(id);
    return ApiResponse.ok(versions);
  }

  @Post(':id/revert/:versionId')
  async revertToVersion(@Param('id') id: string, @Param('versionId') versionId: string, @Req() req: any) {
    const template = await this.templatesService.revertToVersion(id, versionId, req.user.userId);
    return ApiResponse.ok(template);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.templatesService.deleteTemplate(id, req.user.userId);
    return ApiResponse.ok(result);
  }
}
