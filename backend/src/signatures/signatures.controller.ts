import { Controller, Get, Post, Param, Body, Req, Ip } from '@nestjs/common';
import { SignaturesService } from './signatures.service';
import { SignContractDto } from './dto/sign.dto';
import { ApiResponse } from '../common/api-response';
import type { Request } from 'express';

@Controller('sign')
export class SignaturesController {
  constructor(private readonly signaturesService: SignaturesService) {}

  @Get(':token')
  async getContract(@Param('token') token: string) {
    const result = await this.signaturesService.getContractByToken(token);
    return ApiResponse.ok(result);
  }

  @Post(':token')
  async sign(
    @Param('token') token: string,
    @Body() dto: SignContractDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] ?? '';
    const result = await this.signaturesService.signContract(
      token,
      dto,
      ip,
      userAgent,
    );
    return ApiResponse.ok(result);
  }

  @Post(':token/decline')
  async decline(
    @Param('token') token: string,
    @Body('reason') reason: string,
    @Body('note') note: string,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] ?? '';
    const result = await this.signaturesService.declineContract(
      token,
      reason ?? '',
      ip,
      userAgent,
      note,
    );
    return ApiResponse.ok(result);
  }
}
