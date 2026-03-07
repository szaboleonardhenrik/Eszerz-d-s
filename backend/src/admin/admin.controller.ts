import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { ApiResponse } from '../common/api-response';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  async getStats() {
    const stats = await this.adminService.getSystemStats();
    return ApiResponse.ok(stats);
  }

  @Get('users')
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const result = await this.adminService.listUsers(p, l, search || undefined);
    return ApiResponse.ok(result);
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { role?: string; subscriptionTier?: string },
  ) {
    const updated = await this.adminService.updateUser(id, body);
    return ApiResponse.ok(updated);
  }

  @Get('activity')
  async getRecentActivity(@Query('limit') limit?: string) {
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const activity = await this.adminService.getRecentActivity(l);
    return ApiResponse.ok(activity);
  }

  @Get('subscriptions')
  async getSubscriptionBreakdown() {
    const breakdown = await this.adminService.getSubscriptionBreakdown();
    return ApiResponse.ok(breakdown);
  }
}
