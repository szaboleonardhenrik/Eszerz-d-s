import { Module } from '@nestjs/common';
import { PartnerMonitorService } from './partner-monitor.service';
import { PartnerMonitorController } from './partner-monitor.controller';

@Module({
  providers: [PartnerMonitorService],
  controllers: [PartnerMonitorController],
  exports: [PartnerMonitorService],
})
export class PartnerMonitorModule {}
