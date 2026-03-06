import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InAppNotificationsService } from './in-app-notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class InAppNotificationsController {
  constructor(
    private readonly inAppNotificationsService: InAppNotificationsService,
  ) {}

  @Get()
  async findAll(@Req() req: any, @Query('unreadOnly') unreadOnly?: string) {
    const notifications = await this.inAppNotificationsService.findAllByUser(
      req.user.userId,
      unreadOnly === 'true',
    );
    return ApiResponse.ok(notifications);
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: any) {
    const count = await this.inAppNotificationsService.getUnreadCount(
      req.user.userId,
    );
    return ApiResponse.ok({ count });
  }

  @Put('read-all')
  async markAllAsRead(@Req() req: any) {
    const result = await this.inAppNotificationsService.markAllAsRead(
      req.user.userId,
    );
    return ApiResponse.ok(result);
  }

  @Put(':id/read')
  async markAsRead(@Param('id') id: string, @Req() req: any) {
    const result = await this.inAppNotificationsService.markAsRead(
      id,
      req.user.userId,
    );
    return ApiResponse.ok(result);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const result = await this.inAppNotificationsService.delete(
      id,
      req.user.userId,
    );
    return ApiResponse.ok(result);
  }
}
