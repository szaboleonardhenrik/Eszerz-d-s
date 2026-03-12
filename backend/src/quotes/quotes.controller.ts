import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { CreateQuoteTemplateDto } from './dto/create-quote-template.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureFlagGuard, RequireFeature } from '../common/feature-flag.guard';
import { ApiResponse } from '../common/api-response';

// ─── PUBLIC ENDPOINTS (no auth) ─────────────────────────

@Controller('quote-view')
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class QuoteViewController {
  constructor(private readonly quotesService: QuotesService) {}

  @Get(':token')
  async getQuote(@Param('token') token: string) {
    const quote = await this.quotesService.getQuoteByToken(token);
    return ApiResponse.ok(quote);
  }

  @Post(':token/accept')
  async accept(@Param('token') token: string, @Body('note') note?: string) {
    const quote = await this.quotesService.acceptQuoteByToken(token, note);
    return ApiResponse.ok(quote);
  }

  @Post(':token/decline')
  async decline(@Param('token') token: string, @Body('reason') reason?: string) {
    const quote = await this.quotesService.declineQuoteByToken(token, reason);
    return ApiResponse.ok(quote);
  }

  @Get(':token/pdf')
  async downloadPdf(@Param('token') token: string, @Res({ passthrough: true }) res: Response) {
    const quote = await this.quotesService.getQuoteByToken(token);
    const pdfBuffer = await this.quotesService.generateQuotePdf(quote);
    const filename = `${quote.quoteNumber || 'ajanlat'}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(pdfBuffer);
  }

  @Get(':token/comments')
  async getComments(@Param('token') token: string) {
    const quote = await this.quotesService.getQuoteByToken(token);
    const comments = await this.quotesService.getComments(quote.id);
    return ApiResponse.ok(comments);
  }

  @Post(':token/comments')
  async addComment(
    @Param('token') token: string,
    @Body('author') author: string,
    @Body('content') content: string,
  ) {
    const quote = await this.quotesService.getQuoteByToken(token);
    const comment = await this.quotesService.addComment(quote.id, author, content, false);
    return ApiResponse.ok(comment);
  }
}

// ─── AUTHENTICATED ENDPOINTS ────────────────────────────

@Controller('quotes')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@RequireFeature('quote_management')
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateQuoteDto) {
    const quote = await this.quotesService.create(req.user.userId, dto);
    return ApiResponse.ok(quote);
  }

  @Get()
  async findAll(
    @Req() req: any,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.quotesService.findAllByUser(
      req.user.userId, status, search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
    return ApiResponse.ok(result);
  }

  @Get('stats')
  async getStats(@Req() req: any) {
    const stats = await this.quotesService.getStats(req.user.userId);
    return ApiResponse.ok(stats);
  }

  // ─── TEMPLATES ──────────────────────────────────────────

  @Post('templates')
  async createTemplate(@Req() req: any, @Body() dto: CreateQuoteTemplateDto) {
    return ApiResponse.ok(await this.quotesService.createTemplate(req.user.userId, dto));
  }

  @Get('templates')
  async findAllTemplates(@Req() req: any) {
    return ApiResponse.ok(await this.quotesService.findAllTemplates(req.user.userId));
  }

  @Get('templates/:id')
  async findTemplate(@Req() req: any, @Param('id') id: string) {
    return ApiResponse.ok(await this.quotesService.findTemplate(id, req.user.userId));
  }

  @Put('templates/:id')
  async updateTemplate(@Req() req: any, @Param('id') id: string, @Body() dto: CreateQuoteTemplateDto) {
    return ApiResponse.ok(await this.quotesService.updateTemplate(id, req.user.userId, dto));
  }

  @Delete('templates/:id')
  async deleteTemplate(@Req() req: any, @Param('id') id: string) {
    return ApiResponse.ok(await this.quotesService.deleteTemplate(id, req.user.userId));
  }

  // ─── QUOTE ACTIONS ─────────────────────────────────────

  @Get(':id/pdf')
  async generatePdf(@Param('id') id: string, @Req() req: any, @Res({ passthrough: true }) res: Response) {
    const quote = await this.quotesService.findOne(id, req.user.userId);
    const pdfBuffer = await this.quotesService.generateQuotePdf(quote);
    const filename = `${quote.quoteNumber || 'ajanlat'}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
    return new StreamableFile(pdfBuffer);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return ApiResponse.ok(await this.quotesService.findOne(id, req.user.userId));
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: CreateQuoteDto) {
    return ApiResponse.ok(await this.quotesService.update(id, req.user.userId, dto));
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    return ApiResponse.ok(await this.quotesService.delete(id, req.user.userId));
  }

  @Post(':id/duplicate')
  async duplicate(@Req() req: any, @Param('id') id: string) {
    return ApiResponse.ok(await this.quotesService.duplicate(id, req.user.userId));
  }

  @Post(':id/send')
  async send(@Req() req: any, @Param('id') id: string) {
    return ApiResponse.ok(await this.quotesService.sendQuote(id, req.user.userId));
  }

  @Post(':id/resend')
  async resend(@Req() req: any, @Param('id') id: string) {
    return ApiResponse.ok(await this.quotesService.resendQuote(id, req.user.userId));
  }

  @Post(':id/accept')
  async accept(@Req() req: any, @Param('id') id: string) {
    return ApiResponse.ok(await this.quotesService.updateStatus(id, req.user.userId, 'accepted'));
  }

  @Post(':id/decline')
  async decline(@Req() req: any, @Param('id') id: string) {
    return ApiResponse.ok(await this.quotesService.updateStatus(id, req.user.userId, 'declined'));
  }

  @Post(':id/convert-to-contract')
  async convertToContract(@Req() req: any, @Param('id') id: string) {
    return ApiResponse.ok(await this.quotesService.convertToContract(id, req.user.userId));
  }

  @Get(':id/comments')
  async getComments(@Req() req: any, @Param('id') id: string) {
    await this.quotesService.findOne(id, req.user.userId); // verify ownership
    const comments = await this.quotesService.getComments(id);
    return ApiResponse.ok(comments);
  }

  @Post(':id/comments')
  async addComment(
    @Req() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
  ) {
    await this.quotesService.findOne(id, req.user.userId); // verify ownership
    const comment = await this.quotesService.addComment(id, req.user.name || 'Tulajdonos', content, true);
    return ApiResponse.ok(comment);
  }
}
