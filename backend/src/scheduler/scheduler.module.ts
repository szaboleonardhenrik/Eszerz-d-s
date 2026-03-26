import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PartnerMonitorModule } from '../partner-monitor/partner-monitor.module';

@Module({
  imports: [PartnerMonitorModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
