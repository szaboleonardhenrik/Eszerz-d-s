import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { InvoicingService } from './invoicing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('invoicing')
@UseGuards(JwtAuthGuard)
export class InvoicingController {
  constructor(private readonly invoicingService: InvoicingService) {}

  @Get('settings')
  async getSettings(@Req() req: any) {
    const settings = await this.invoicingService.getInvoiceSettings(
      req.user.userId,
    );
    return ApiResponse.ok(settings);
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
