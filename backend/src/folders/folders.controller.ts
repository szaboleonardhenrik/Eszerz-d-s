import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('folders')
@UseGuards(JwtAuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Get()
  async findAll(@Req() req: any) {
    const folders = await this.foldersService.findAllByUser(req.user.userId);
    return ApiResponse.ok(folders);
  }

  @Post()
  async create(@Body() body: { name: string; color?: string; parentId?: string }, @Req() req: any) {
    const folder = await this.foldersService.create(req.user.userId, body);
    return ApiResponse.ok(folder);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: { name?: string; color?: string }, @Req() req: any) {
    const folder = await this.foldersService.update(id, req.user.userId, body);
    return ApiResponse.ok(folder);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.foldersService.delete(id, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Post(':folderId/contracts/:contractId')
  async moveContractToFolder(
    @Param('folderId') folderId: string,
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    const result = await this.foldersService.moveContract(contractId, folderId, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Delete('contracts/:contractId')
  async removeContractFromFolder(@Param('contractId') contractId: string, @Req() req: any) {
    const result = await this.foldersService.moveContract(contractId, null, req.user.userId);
    return ApiResponse.ok(result);
  }
}
