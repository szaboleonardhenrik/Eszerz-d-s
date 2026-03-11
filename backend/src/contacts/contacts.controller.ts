import { Controller, Get, Post, Put, Delete, Param, Body, Query, Res, UseGuards, Req } from '@nestjs/common';
import type { Response } from 'express';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async findAll(
    @Query('search') search: string,
    @Query('withStats') withStats: string,
    @Query('group') group: string,
    @Req() req: any,
  ) {
    if (withStats === 'true') {
      const contacts = await this.contactsService.findAllWithStats(req.user.userId, search, group || undefined);
      return ApiResponse.ok(contacts);
    }
    const contacts = await this.contactsService.findAllByUser(req.user.userId, search, group || undefined);
    return ApiResponse.ok(contacts);
  }

  @Get('groups')
  async getGroups(@Req() req: any) {
    const groups = await this.contactsService.getGroups(req.user.userId);
    return ApiResponse.ok(groups);
  }

  @Get('export')
  async exportContacts(
    @Req() req: any,
    @Res() res: Response,
    @Query('format') format?: string,
    @Query('group') group?: string,
  ) {
    const fmt = format === 'json' ? 'json' : 'csv';
    const result = await this.contactsService.exportContacts(req.user.userId, fmt, group || undefined);
    const filename = fmt === 'json' ? 'partnerek.json' : 'partnerek.csv';
    res.setHeader('Content-Type', `${result.contentType}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(result.data);
  }

  // ── Company endpoints (must be before :id routes) ──

  @Get('companies/list')
  async findAllCompanies(@Query('search') search: string, @Req() req: any) {
    const companies = await this.contactsService.findAllCompanies(req.user.userId, search || undefined);
    return ApiResponse.ok(companies);
  }

  @Post('companies')
  async createCompany(
    @Body() body: { name: string; taxNumber?: string; address?: string; phone?: string; email?: string; notes?: string },
    @Req() req: any,
  ) {
    const company = await this.contactsService.createCompany(req.user.userId, body);
    return ApiResponse.ok(company);
  }

  @Put('companies/:companyId')
  async updateCompany(
    @Param('companyId') companyId: string,
    @Body() body: { name?: string; taxNumber?: string; address?: string; phone?: string; email?: string; notes?: string },
    @Req() req: any,
  ) {
    const company = await this.contactsService.updateCompany(companyId, req.user.userId, body);
    return ApiResponse.ok(company);
  }

  @Delete('companies/:companyId')
  async deleteCompany(@Param('companyId') companyId: string, @Req() req: any) {
    const result = await this.contactsService.deleteCompany(companyId, req.user.userId);
    return ApiResponse.ok(result);
  }

  // ── Contact endpoints with :id ──

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('withContracts') withContracts: string, @Req() req: any) {
    if (withContracts === 'true') {
      const contact = await this.contactsService.findOneWithContracts(id, req.user.userId);
      return ApiResponse.ok(contact);
    }
    const contact = await this.contactsService.findOne(id, req.user.userId);
    return ApiResponse.ok(contact);
  }

  @Get(':id/timeline')
  async getTimeline(@Param('id') id: string, @Req() req: any) {
    const timeline = await this.contactsService.getTimeline(id, req.user.userId);
    return ApiResponse.ok(timeline);
  }

  @Post()
  async create(
    @Body() body: { name: string; email: string; company?: string; phone?: string; taxNumber?: string; address?: string; notes?: string; group?: string },
    @Req() req: any,
  ) {
    const contact = await this.contactsService.create(req.user.userId, body);
    return ApiResponse.ok(contact);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; company?: string; phone?: string; taxNumber?: string; address?: string; notes?: string; group?: string },
    @Req() req: any,
  ) {
    const contact = await this.contactsService.update(id, req.user.userId, body);
    return ApiResponse.ok(contact);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const result = await this.contactsService.delete(id, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Post(':id/companies/:companyId')
  async linkToCompany(
    @Param('id') contactId: string,
    @Param('companyId') companyId: string,
    @Body() body: { role?: string },
    @Req() req: any,
  ) {
    const result = await this.contactsService.linkContactToCompany(contactId, companyId, req.user.userId, body.role);
    return ApiResponse.ok(result);
  }

  @Delete(':id/companies/:companyId')
  async unlinkFromCompany(
    @Param('id') contactId: string,
    @Param('companyId') companyId: string,
    @Req() req: any,
  ) {
    const result = await this.contactsService.unlinkContactFromCompany(contactId, companyId, req.user.userId);
    return ApiResponse.ok(result);
  }
}
