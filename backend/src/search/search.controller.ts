import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') query: string, @Req() req: any) {
    if (!query || query.trim().length < 2) {
      return ApiResponse.ok({ contracts: [], contacts: [], templates: [] });
    }
    const results = await this.searchService.globalSearch(query.trim(), req.user.userId);
    return ApiResponse.ok(results);
  }
}
