import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { RemindersService } from './reminders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('reminders')
@UseGuards(JwtAuthGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post()
  async create(
    @Body()
    body: {
      contractId: string;
      type: string;
      message: string;
      remindAt: string;
    },
    @Req() req: any,
  ) {
    const reminder = await this.remindersService.create(req.user.userId, body);
    return ApiResponse.ok(reminder);
  }

  @Get('upcoming')
  async getUpcoming(@Req() req: any) {
    const reminders = await this.remindersService.getUpcomingReminders(
      req.user.userId,
    );
    return ApiResponse.ok(reminders);
  }

  @Get('alerts')
  async getAlerts(@Req() req: any) {
    const alerts = await this.remindersService.getDashboardAlerts(
      req.user.userId,
    );
    return ApiResponse.ok(alerts);
  }

  @Get('contract/:contractId')
  async listByContract(
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    const reminders = await this.remindersService.listByContract(
      contractId,
      req.user.userId,
    );
    return ApiResponse.ok(reminders);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const result = await this.remindersService.delete(id, req.user.userId);
    return ApiResponse.ok(result);
  }
}
