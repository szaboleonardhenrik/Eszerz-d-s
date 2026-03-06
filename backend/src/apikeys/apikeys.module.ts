import { Module } from '@nestjs/common';
import { ApiKeysService } from './apikeys.service';
import { ApiKeysController } from './apikeys.controller';
import { ApiKeyGuard } from './apikey-auth.guard';
import { ApiKeyOrJwtGuard } from './api-key-or-jwt.guard';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyGuard, ApiKeyOrJwtGuard],
  exports: [ApiKeysService, ApiKeyGuard, ApiKeyOrJwtGuard],
})
export class ApiKeysModule {}
