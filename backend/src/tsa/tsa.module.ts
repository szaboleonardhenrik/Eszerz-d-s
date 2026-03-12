import { Global, Module } from '@nestjs/common';
import { TsaService } from './tsa.service';

@Global()
@Module({
  providers: [TsaService],
  exports: [TsaService],
})
export class TsaModule {}
