import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  async findAll(@Query('search') search: string, @Query('withStats') withStats: string, @Req() req: any) {
    if (withStats === 'true') {
      const contacts = await this.contactsService.findAllWithStats(req.user.userId, search);
      return ApiResponse.ok(contacts);
    }
    const contacts = await this.contactsService.findAllByUser(req.user.userId, search);
    return ApiResponse.ok(contacts);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('withContracts') withContracts: string, @Req() req: any) {
    if (withContracts === 'true') {
      const contact = await this.contactsService.findOneWithContracts(id, req.user.userId);
      return ApiResponse.ok(contact);
    }
    const contact = await this.contactsService.findOne(id, req.user.userId);
    return ApiResponse.ok(contact);
  }

  @Post()
  async create(
    @Body() body: { name: string; email: string; company?: string; phone?: string; taxNumber?: string; address?: string; notes?: string },
    @Req() req: any,
  ) {
    const contact = await this.contactsService.create(req.user.userId, body);
    return ApiResponse.ok(contact);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; company?: string; phone?: string; taxNumber?: string; address?: string; notes?: string },
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
}
