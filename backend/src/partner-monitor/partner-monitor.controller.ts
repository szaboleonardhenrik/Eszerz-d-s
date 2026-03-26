import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PartnerMonitorService } from './partner-monitor.service';
import { CreatePartnerDto, UpdatePartnerDto, BulkCreatePartnersDto, UpdateDigestConfigDto } from './dto';

@Controller('partner-monitor')
@UseGuards(JwtAuthGuard)
export class PartnerMonitorController {
  constructor(private readonly service: PartnerMonitorService) {}

  // ─── DASHBOARD ──────────────────────────────────────────

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.service.getDashboard(req.user.id);
  }

  // ─── PARTNERS CRUD ──────────────────────────────────────

  @Get('partners')
  getPartners(
    @Req() req: any,
    @Query('active') active?: string,
    @Query('search') search?: string,
  ) {
    return this.service.getPartners(req.user.id, {
      isActive: active === undefined ? undefined : active === 'true',
      search,
    });
  }

  @Get('partners/:id')
  getPartner(@Req() req: any, @Param('id') id: string) {
    return this.service.getPartner(req.user.id, id);
  }

  @Post('partners')
  createPartner(@Req() req: any, @Body() dto: CreatePartnerDto) {
    return this.service.createPartner(req.user.id, dto);
  }

  @Post('partners/bulk')
  bulkCreatePartners(@Req() req: any, @Body() dto: BulkCreatePartnersDto) {
    return this.service.bulkCreatePartners(req.user.id, dto.partners);
  }

  @Put('partners/:id')
  updatePartner(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.service.updatePartner(req.user.id, id, dto);
  }

  @Delete('partners/:id')
  deletePartner(@Req() req: any, @Param('id') id: string) {
    return this.service.deletePartner(req.user.id, id);
  }

  // ─── JOB LISTINGS ──────────────────────────────────────

  @Get('listings')
  getJobListings(
    @Req() req: any,
    @Query('partnerId') partnerId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.service.getJobListings(req.user.id, {
      partnerId,
      status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  // ─── SCAN ───────────────────────────────────────────────

  @Post('scan')
  async triggerScan(@Req() req: any) {
    return this.service.scanAllPartners(req.user.id);
  }

  @Get('runs')
  getScrapeRuns(@Req() req: any) {
    return this.service.getScrapeRuns(req.user.id);
  }

  // ─── VALIDATE COMPANY ───────────────────────────────────

  @Get('validate')
  validateCompany(@Query('name') name: string) {
    return this.service.validateCompany(name);
  }

  // ─── DIGEST CONFIG ────────────────────────────────────

  @Get('digest-config')
  getDigestConfig(@Req() req: any) {
    return this.service.getDigestConfig(req.user.id);
  }

  @Put('digest-config')
  updateDigestConfig(@Req() req: any, @Body() dto: UpdateDigestConfigDto) {
    return this.service.updateDigestConfig(req.user.id, dto);
  }

  // ─── E-CÉGJEGYZÉK ───────────────────────────────────────

  @Get('lookup')
  lookupCompany(@Query('name') name: string) {
    return this.service.lookupCompany(name);
  }
}
