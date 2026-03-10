import { Controller, Post, Get, Patch, UseGuards, Req, Query, Param, Body } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('invoicing')
@UseGuards(JwtAuthGuard)
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Get('settings')
  async getSettings(@Req() req: any) {
    const settings = await this.invoicingService.getInvoiceSettings(req.user.userId);
    return ApiResponse.ok(settings);
  }

  @Patch('settings')
  async updateSettings(@Req() req: any, @Body() body: { autoInvoice: boolean }) {
    const updated = await this.invoicingService.updateInvoiceSettings(req.user.userId, body.autoInvoice);
    return ApiResponse.ok(updated);
  }

  @Get('invoices')
  async listInvoices(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '20', 10) || 20));
    const result = await this.invoicingService.listInvoices(req.user.userId, p, l);
    return ApiResponse.ok(result);
  }

  @Post('retry/:id')
  async retryInvoice(@Req() req: any, @Param('id') id: string) {
    const result = await this.invoicingService.retryInvoice(req.user.userId, id);
    return ApiResponse.ok(result);
  }

  @Post('test')
  async testInvoice(@Req() req: any) {
    if (!this.invoicingService.isEnabled()) {
      return ApiResponse.ok({
        enabled: false,
        message: 'Számlázz.hu nincs konfigurálva. Állítsd be a SZAMLAZZ_AGENT_KEY-t.',
      });
    }
    return ApiResponse.ok({
      enabled: true,
      message: 'Számlázz.hu integráció aktív.',
    });
  }
}
