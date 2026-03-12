import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { VerifyController } from './verify.controller';
import { TemplatesModule } from '../templates/templates.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
  imports: [TemplatesModule, CreditsModule],
  controllers: [VerifyController, ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}
