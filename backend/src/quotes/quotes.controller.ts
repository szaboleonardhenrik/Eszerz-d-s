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
} from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
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
      req.user.userId,
      status,
      search,
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

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const quote = await this.quotesService.findOne(id, req.user.userId);
    return ApiResponse.ok(quote);
  }

  @Put(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CreateQuoteDto,
  ) {
    const quote = await this.quotesService.update(id, req.user.userId, dto);
    return ApiResponse.ok(quote);
  }

  @Delete(':id')
  async delete(@Req() req: any, @Param('id') id: string) {
    const result = await this.quotesService.delete(id, req.user.userId);
    return ApiResponse.ok(result);
  }

  @Post(':id/duplicate')
  async duplicate(@Req() req: any, @Param('id') id: string) {
    const quote = await this.quotesService.duplicate(id, req.user.userId);
    return ApiResponse.ok(quote);
  }

  @Post(':id/send')
  async send(@Req() req: any, @Param('id') id: string) {
    const quote = await this.quotesService.updateStatus(
      id,
      req.user.userId,
      'sent',
    );
    return ApiResponse.ok(quote);
  }

  @Post(':id/accept')
  async accept(@Req() req: any, @Param('id') id: string) {
    const quote = await this.quotesService.updateStatus(
      id,
      req.user.userId,
      'accepted',
    );
    return ApiResponse.ok(quote);
  }

  @Post(':id/decline')
  async decline(@Req() req: any, @Param('id') id: string) {
    const quote = await this.quotesService.updateStatus(
      id,
      req.user.userId,
      'declined',
    );
    return ApiResponse.ok(quote);
  }
}
