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
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller()
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get('contracts/:contractId/comments')
  async getByContract(
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    const comments = await this.commentsService.getByContract(
      contractId,
      req.user.userId,
    );
    return ApiResponse.ok(comments);
  }

  @Post('contracts/:contractId/comments')
  async create(
    @Param('contractId') contractId: string,
    @Body('content') content: string,
    @Req() req: any,
  ) {
    const comment = await this.commentsService.create(
      contractId,
      req.user.userId,
      content,
    );
    return ApiResponse.ok(comment);
  }

  @Delete('comments/:id')
  async delete(@Param('id') id: string, @Req() req: any) {
    const result = await this.commentsService.delete(id, req.user.userId);
    return ApiResponse.ok(result);
  }
}
