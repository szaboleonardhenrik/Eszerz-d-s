import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContractsService } from './contracts.service';
import { ApiResponse } from '../common/api-response';

@Controller('contracts')
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class VerifyController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get('verify/:hash')
  async verifyContract(@Param('hash') hash: string) {
    const result = await this.contractsService.verifyByHash(hash);
    return ApiResponse.ok(result);
  }
}
