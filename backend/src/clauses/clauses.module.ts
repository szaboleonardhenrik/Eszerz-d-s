import { Module } from '@nestjs/common';
import { ClausesService } from './clauses.service';
import { ClausesController } from './clauses.controller';

@Module({
  controllers: [ClausesController],
  providers: [ClausesService],
  exports: [ClausesService],
})
export class ClausesModule {}
