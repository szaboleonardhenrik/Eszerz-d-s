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
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('revenue')
  async getRevenue() {
    const revenue = await this.adminService.getRevenueStats();
    return ApiResponse.ok(revenue);
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

  @Post('users/:id/impersonate')
  @SuperAdminOnly()
  async impersonateUser(
    @Param('id') id: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.adminService.impersonateUser(id, req.user.userId, req.userRole);

    // Set the impersonation token as httpOnly cookie
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000, // 1 hour
      path: '/',
    });

    return ApiResponse.ok({
      user: result.user,
      expiresIn: result.expiresIn,
      message: `Bejelentkezve mint: ${result.user.name}`,
    });
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

  // ── API Usage ──

  @Get('api-usage')
  async getApiUsage(@Query('days') days?: string) {
    const d = Math.min(90, Math.max(1, parseInt(days || '30', 10) || 30));
    const usage = await this.adminService.getApiUsageStats(d);
    return ApiResponse.ok(usage);
  }

  // ── Email Logs ──

  @Get('email-logs')
  async getEmailLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const logs = await this.adminService.getEmailLogs(p, l, {
      status: status || undefined,
      type: type || undefined,
      search: search || undefined,
    });
    return ApiResponse.ok(logs);
  }

  @Post('email-logs/:id/resend')
  @SuperAdminOnly()
  async resendEmail(@Param('id') id: string) {
    const result = await this.adminService.resendEmail(id);
    return ApiResponse.ok(result);
  }

  // ── System Broadcasts ──

  @Get('broadcasts')
  async listBroadcasts() {
    const broadcasts = await this.adminService.listBroadcasts();
    return ApiResponse.ok(broadcasts);
  }

  @Post('broadcasts')
  @SuperAdminOnly()
  async createBroadcast(
    @Body() body: { title: string; message: string; type?: string; expiresAt?: string },
    @Req() req: any,
  ) {
    const result = await this.adminService.createBroadcast(body, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Delete('broadcasts/:id')
  @SuperAdminOnly()
  async deleteBroadcast(@Param('id') id: string) {
    const result = await this.adminService.deleteBroadcast(id);
    return ApiResponse.ok(result);
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
