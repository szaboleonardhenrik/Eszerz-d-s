import { Controller, Post, Get, Delete, Body, Query, Param, UseGuards, Req } from '@nestjs/common';
import { PortalService } from './portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

  @Get('verify')
  async verifyToken(@Query('token') token: string) {
    if (!token) {
      return ApiResponse.error('BAD_REQUEST', 'Token megadasa kotelezo.');
    }
    const result = await this.portalService.verifyToken(token);
    return ApiResponse.ok(result);
  }

  @Get('audit-log/:contractId')
  async getAuditLog(
    @Param('contractId') contractId: string,
    @Query('token') token: string,
  ) {
    if (!token) {
      return ApiResponse.error('BAD_REQUEST', 'Token megadasa kotelezo.');
    }
    const result = await this.portalService.getAuditLog(token, contractId);
    return ApiResponse.ok(result);
  }

  // ── Authenticated invitation endpoints ──

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  async invitePartner(
    @Body() body: { email: string; teamId?: string },
    @Req() req: any,
  ) {
    const teamId = body.teamId || req.user.userId; // fallback: use userId as team identifier
    const result = await this.portalService.invitePartner(req.user.userId, teamId, body.email);
    return ApiResponse.ok(result);
  }

  @Get('invitations')
  @UseGuards(JwtAuthGuard)
  async getInvitations(@Req() req: any) {
    const result = await this.portalService.getInvitations(req.user.userId);
    return ApiResponse.ok(result);
  }

  @Delete('invitations/:id')
  @UseGuards(JwtAuthGuard)
  async revokeInvitation(@Param('id') id: string, @Req() req: any) {
    const result = await this.portalService.revokeInvitation(id, req.user.userId);
    return ApiResponse.ok(result);
  }
}
