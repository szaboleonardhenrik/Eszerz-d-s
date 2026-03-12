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
import { CreditsService } from '../credits/credits.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { SuperAdminOnly } from './superadmin.decorator';
import { ApiResponse } from '../common/api-response';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly creditsService: CreditsService,
  ) {}

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

  @Post('users')
  @SuperAdminOnly()
  async createUser(
    @Body() body: {
      name: string;
      email: string;
      password: string;
      role?: string;
      subscriptionTier?: string;
      companyName?: string;
    },
  ) {
    const user = await this.adminService.createUser(body);
    return ApiResponse.ok(user);
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

  // ── Promo Codes ──

  @Get('promo-codes')
  async listPromoCodes() {
    const codes = await this.adminService.listPromoCodes();
    return ApiResponse.ok(codes);
  }

  @Post('promo-codes')
  @SuperAdminOnly()
  async createPromoCode(@Body() body: any, @Req() req: any) {
    const code = await this.adminService.createPromoCode(body, req.user.userId);
    return ApiResponse.ok(code);
  }

  @Patch('promo-codes/:id')
  @SuperAdminOnly()
  async updatePromoCode(@Param('id') id: string, @Body() body: any) {
    const code = await this.adminService.updatePromoCode(id, body);
    return ApiResponse.ok(code);
  }

  @Delete('promo-codes/:id')
  @SuperAdminOnly()
  async deletePromoCode(@Param('id') id: string) {
    const result = await this.adminService.deletePromoCode(id);
    return ApiResponse.ok(result);
  }

  @Post('promo-codes/validate')
  async validatePromoCode(@Body() body: { code: string }) {
    const result = await this.adminService.validatePromoCode(body.code);
    return ApiResponse.ok(result);
  }

  @Post('promo-codes/apply')
  async applyPromoCode(@Body() body: { code: string }, @Req() req: any) {
    const result = await this.adminService.applyPromoCode(body.code, req.user.userId);
    return ApiResponse.ok(result);
  }

  // ── Feature Flags ──

  @Get('feature-flags')
  async listFeatureFlags() {
    const flags = await this.adminService.listFeatureFlags();
    return ApiResponse.ok(flags);
  }

  @Post('feature-flags')
  @SuperAdminOnly()
  async createFeatureFlag(@Body() body: { key: string; name: string; description?: string; minTier?: string }) {
    const flag = await this.adminService.createFeatureFlag(body);
    return ApiResponse.ok(flag);
  }

  @Patch('feature-flags/:id')
  @SuperAdminOnly()
  async updateFeatureFlag(@Param('id') id: string, @Body() body: { enabled?: boolean; minTier?: string | null }) {
    const flag = await this.adminService.updateFeatureFlag(id, body);
    return ApiResponse.ok(flag);
  }

  // ── Webhook Delivery Logs ──

  @Get('webhook-logs')
  async getWebhookLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('webhookId') webhookId?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const logs = await this.adminService.getWebhookDeliveryLogs(p, l, webhookId || undefined);
    return ApiResponse.ok(logs);
  }

  @Get('webhook-logs/stats')
  async getWebhookStats() {
    const stats = await this.adminService.getWebhookDeliveryStats();
    return ApiResponse.ok(stats);
  }

  // ── Maintenance Mode ──

  @Get('maintenance')
  async getMaintenanceStatus() {
    const status = await this.adminService.getMaintenanceStatus();
    return ApiResponse.ok(status);
  }

  @Post('maintenance')
  @SuperAdminOnly()
  async setMaintenanceMode(@Body() body: { enabled: boolean; message?: string }) {
    const result = await this.adminService.setMaintenanceMode(body.enabled, body.message);
    return ApiResponse.ok(result);
  }

  // ── Invoice Admin ──

  @Get('invoices')
  async listInvoices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const p = Math.max(1, parseInt(page || '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
    const invoices = await this.adminService.listAllInvoices(p, l, status || undefined);
    return ApiResponse.ok(invoices);
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

  // ── Credit Management ──

  @Post('users/:id/credits')
  @SuperAdminOnly()
  async grantCredits(
    @Param('id') id: string,
    @Body() body: { amount: number; description?: string },
  ) {
    const newBalance = await this.creditsService.adminGrant(id, body.amount, body.description);
    return ApiResponse.ok({ balance: newBalance, granted: body.amount });
  }

  @Get('users/:id/credits')
  async getUserCredits(@Param('id') id: string) {
    const balance = await this.creditsService.getBalance(id);
    const history = await this.creditsService.getHistory(id, 1, 10);
    return ApiResponse.ok({ balance, ...history });
  }
}
