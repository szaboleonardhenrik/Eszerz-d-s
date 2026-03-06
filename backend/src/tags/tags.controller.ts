import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { TagsService } from './tags.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  async findAll(@Req() req: any) {
    const tags = await this.tagsService.findAllByUser(req.user.userId);
    return ApiResponse.ok(tags);
  }

  @Post()
  async create(@Body() body: { name: string; color?: string }, @Req() req: any) {
    const tag = await this.tagsService.create(req.user.userId, body.name, body.color);
    return ApiResponse.ok(tag);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string; color?: string }, @Req() req: any) {
    const tag = await this.tagsService.update(id, req.user.userId, body);
    return ApiResponse.ok(tag);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.tagsService.delete(id, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Post(':tagId/contracts/:contractId')
  async tagContract(@Param('tagId') tagId: string, @Param('contractId') contractId: string, @Req() req: any) {
    const result = await this.tagsService.tagContract(contractId, tagId, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Delete(':tagId/contracts/:contractId')
  async untagContract(@Param('tagId') tagId: string, @Param('contractId') contractId: string, @Req() req: any) {
    const result = await this.tagsService.untagContract(contractId, tagId, req.user.userId);
    return ApiResponse.ok(result);
  }
}
