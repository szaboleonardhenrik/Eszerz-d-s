import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureFlagGuard, RequireFeature } from '../common/feature-flag.guard';
import { ApiResponse } from '../common/api-response';

@Controller('webhooks')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  async list(@Req() req: any) {
    const webhooks = await this.webhooksService.findAllByUser(req.user.userId);
    return ApiResponse.ok(webhooks);
  }

  @Post()
  async create(
    @Body() body: { url: string; events: string; secret?: string },
    @Req() req: any,
  ) {
    const webhook = await this.webhooksService.create(req.user.userId, body);
    return ApiResponse.ok(webhook);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { url?: string; events?: string; active?: boolean },
    @Req() req: any,
  ) {
    const webhook = await this.webhooksService.update(
      id,
      req.user.userId,
      body,
    );
    return ApiResponse.ok(webhook);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.webhooksService.delete(id, req.user.userId);
    return ApiResponse.ok({ message: 'Webhook törölve' });
  }
}
