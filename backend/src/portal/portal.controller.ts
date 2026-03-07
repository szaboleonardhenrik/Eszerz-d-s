import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { PortalService } from './portal.service';
import { ApiResponse } from '../common/api-response';

@Controller('portal')
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Post('request-access')
  async requestAccess(@Body() body: { email: string }) {
    const result = await this.portalService.requestAccess(body.email);
    return ApiResponse.ok(result);
  }

  @Get('contracts')
  async getContracts(@Query('token') token: string) {
    if (!token) {
      return ApiResponse.error('BAD_REQUEST', 'Token megadasa kotelezo.');
    }
    const result = await this.portalService.getContracts(token);
    return ApiResponse.ok(result);
  }
}
