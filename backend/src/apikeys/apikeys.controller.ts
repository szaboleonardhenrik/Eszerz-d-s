import { Controller, Get, Post, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiKeysService } from './apikeys.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  async list(@Req() req: any) {
    const keys = await this.apiKeysService.listKeys(req.user.userId);
    return ApiResponse.ok(keys);
  }

  @Post()
  async create(
    @Body() body: { name: string; scopes?: string },
    @Req() req: any,
  ) {
    const result = await this.apiKeysService.createKey(
      req.user.userId,
      body.name,
      body.scopes ?? 'contracts:read,templates:read',
    );
    return ApiResponse.ok(result);
  }

  @Delete(':id')
  async revoke(@Param('id') id: string, @Req() req: any) {
    await this.apiKeysService.deleteKey(req.user.userId, id);
    return ApiResponse.ok({ message: 'API kulcs törölve' });
  }
}
