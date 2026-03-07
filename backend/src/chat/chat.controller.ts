import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async ask(
    @Body() body: { question: string },
    @Req() req: any,
  ) {
    if (!body.question || typeof body.question !== 'string' || body.question.trim().length === 0) {
      throw new BadRequestException('A kerdes megadasa kotelezo.');
    }

    if (body.question.length > 2000) {
      throw new BadRequestException('A kerdes maximum 2000 karakter lehet.');
    }

    const answer = await this.chatService.askQuestion(
      req.user.userId,
      body.question.trim(),
    );

    return ApiResponse.ok({ answer });
  }
}
