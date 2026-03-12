import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { SuperAdminOnly } from './superadmin.decorator';
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
    @Query('role') role?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const result = await this.adminService.listUsers(p, l, search || undefined, role || undefined);
    return ApiResponse.ok(result);
  }

  @Patch('users/:id')
  @SuperAdminOnly()
  async updateUser(
    @Param('id') id: string,
    @Body() body: { role?: string; subscriptionTier?: string },
    @Req() req: any,
  ) {
    const updated = await this.adminService.updateUser(id, body, req.userRole);
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

  // ── Authorized Signers ──

  @Get('authorized-signers')
  async listAuthorizedSigners(@Req() req: any) {
    const signers = await this.adminService.listAuthorizedSigners(req.user.userId);
    return ApiResponse.ok(signers);
  }

  @Post('authorized-signers')
  async createAuthorizedSigner(@Req() req: any, @Body() body: any) {
    const signer = await this.adminService.createAuthorizedSigner(req.user.userId, body);
    return ApiResponse.ok(signer);
  }

  @Patch('authorized-signers/:id')
  async updateAuthorizedSigner(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const signer = await this.adminService.updateAuthorizedSigner(id, req.user.userId, body);
    return ApiResponse.ok(signer);
  }

  @Delete('authorized-signers/:id')
  async deleteAuthorizedSigner(@Req() req: any, @Param('id') id: string) {
    await this.adminService.deleteAuthorizedSigner(id, req.user.userId);
    return ApiResponse.ok({ deleted: true });
  }
}
