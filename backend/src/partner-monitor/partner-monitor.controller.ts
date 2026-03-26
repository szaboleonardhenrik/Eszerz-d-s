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

  // ─── LISTS ─────────────────────────────────────────────

  @Get('lists')
  getLists(@Req() req: any) {
    return this.service.getLists(req.user.userId);
  }

  @Get('lists/:id')
  getList(@Req() req: any, @Param('id') id: string) {
    return this.service.getList(req.user.userId, id);
  }

  @Post('lists')
  createList(@Req() req: any, @Body() body: { name: string; description?: string; emails?: string[] }) {
    return this.service.createList(req.user.userId, body);
  }

  @Put('lists/:id')
  updateList(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.service.updateList(req.user.userId, id, body);
  }

  @Delete('lists/:id')
  deleteList(@Req() req: any, @Param('id') id: string) {
    return this.service.deleteList(req.user.userId, id);
  }

  @Post('lists/:id/scan')
  scanList(@Req() req: any, @Param('id') id: string) {
    return this.service.scanList(req.user.userId, id);
  }

  // ─── DASHBOARD ──────────────────────────────────────────

  @Get('dashboard')
  getDashboard(@Req() req: any, @Query('listId') listId?: string) {
    return this.service.getDashboard(req.user.userId, listId);
  }

  // ─── CHART DATA ─────────────────────────────────────────

  @Get('chart')
  getChartData(@Req() req: any, @Query('listId') listId?: string, @Query('partnerId') partnerId?: string) {
    return this.service.getChartData(req.user.userId, listId, partnerId);
  }

  // ─── PARTNERS CRUD ──────────────────────────────────────

  @Get('partners')
  getPartners(
    @Req() req: any,
    @Query('active') active?: string,
    @Query('search') search?: string,
    @Query('listId') listId?: string,
  ) {
    return this.service.getPartners(req.user.userId, {
      isActive: active === undefined ? undefined : active === 'true',
      search,
      listId,
    });
  }

  @Get('partners/:id')
  getPartner(@Req() req: any, @Param('id') id: string) {
    return this.service.getPartner(req.user.userId, id);
  }

  @Post('partners')
  createPartner(@Req() req: any, @Body() dto: CreatePartnerDto & { listId?: string }) {
    return this.service.createPartner(req.user.userId, dto);
  }

  @Post('partners/bulk')
  bulkCreatePartners(@Req() req: any, @Body() dto: BulkCreatePartnersDto) {
    return this.service.bulkCreatePartners(req.user.userId, dto.partners);
  }

  @Put('partners/:id')
  updatePartner(@Req() req: any, @Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    return this.service.updatePartner(req.user.userId, id, dto);
  }

  @Delete('partners/:id')
  deletePartner(@Req() req: any, @Param('id') id: string) {
    return this.service.deletePartner(req.user.userId, id);
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
    return this.service.getJobListings(req.user.userId, {
      partnerId, status,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  // ─── SCAN ───────────────────────────────────────────────

  @Post('scan')
  async triggerScan(@Req() req: any) {
    return this.service.scanAllPartners(req.user.userId);
  }

  @Get('runs')
  getScrapeRuns(@Req() req: any, @Query('listId') listId?: string) {
    return this.service.getScrapeRuns(req.user.userId, listId);
  }

  @Get('runs/:id/listings')
  getRunListings(@Req() req: any, @Param('id') id: string) {
    return this.service.getRunListings(req.user.userId, id);
  }

  // ─── VALIDATE COMPANY ───────────────────────────────────

  @Get('validate')
  validateCompany(@Query('name') name: string) {
    return this.service.validateCompany(name);
  }

  // ─── DIGEST CONFIG ────────────────────────────────────

  @Get('digest-config')
  getDigestConfig(@Req() req: any) {
    return this.service.getDigestConfig(req.user.userId);
  }

  @Put('digest-config')
  updateDigestConfig(@Req() req: any, @Body() dto: UpdateDigestConfigDto) {
    return this.service.updateDigestConfig(req.user.userId, dto);
  }

  // ─── E-CÉGJEGYZÉK ───────────────────────────────────────

  @Get('lookup')
  lookupCompany(@Query('name') name: string) {
    return this.service.lookupCompany(name);
  }
}
