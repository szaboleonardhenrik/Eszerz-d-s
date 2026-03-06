import { Controller, Post, Body, Req, UseGuards, Headers } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  async createCheckout(@Body() body: { priceId: string }, @Req() req: any) {
    const url = await this.billingService.createCheckoutSession(req.user.userId, body.priceId);
    return ApiResponse.ok({ url });
  }

  @Post('portal')
  @UseGuards(JwtAuthGuard)
  async createPortal(@Req() req: any) {
    const url = await this.billingService.createPortalSession(req.user.userId);
    return ApiResponse.ok({ url });
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    await this.billingService.handleWebhook(req.rawBody!, signature);
    return { received: true };
  }
}
