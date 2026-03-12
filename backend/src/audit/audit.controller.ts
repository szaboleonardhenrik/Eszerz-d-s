import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponse } from '../common/api-response';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async list(
    @Req() req: any,
    @Query('contractId') contractId?: string,
    @Query('eventType') eventType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const result = await this.auditService.getByUser(
      req.user.userId,
      { contractId, eventType, dateFrom, dateTo },
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );

    // Meta-audit: log that the user accessed audit logs
    this.auditService.logMetaAudit({
      userId: req.user.userId,
      eventType: 'audit_accessed',
      eventData: { filters: { contractId, eventType, dateFrom, dateTo } },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
      contractId,
    }).catch(() => {}); // fire-and-forget

    return ApiResponse.ok(result);
  }

  @Get('export')
  async exportLogs(
    @Req() req: any,
    @Res() res: Response,
    @Query('format') format?: string,
    @Query('contractId') contractId?: string,
    @Query('eventType') eventType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const exportFormat = format === 'json' ? 'json' : 'csv';
    const result = await this.auditService.exportAuditLogs(
      req.user.userId,
      exportFormat,
      { contractId, eventType, dateFrom, dateTo },
    );

    // Meta-audit: log that the user exported audit logs
    this.auditService.logMetaAudit({
      userId: req.user.userId,
      eventType: 'audit_exported',
      eventData: { format: exportFormat, filters: { contractId, eventType, dateFrom, dateTo } },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
      contractId,
    }).catch(() => {}); // fire-and-forget

    const filename = exportFormat === 'json' ? 'audit-naplo.json' : 'audit-naplo.csv';

    res.setHeader('Content-Type', `${result.contentType}; charset=utf-8`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(result.data);
  }

  @Get('contract/:contractId')
  async getByContract(
    @Param('contractId') contractId: string,
    @Req() req: any,
  ) {
    // Verify the contract belongs to the user
    const allLogs = await this.auditService.getByUser(
      req.user.userId,
      { contractId },
      1,
      1,
    );

    // Meta-audit: log contract-specific audit access
    this.auditService.logMetaAudit({
      userId: req.user.userId,
      eventType: 'audit_accessed',
      eventData: { scope: 'contract' },
      ipAddress: req.ip,
      userAgent: req.headers?.['user-agent'],
      contractId,
    }).catch(() => {}); // fire-and-forget

    // Still return logs via the direct method for full data
    const logs = await this.auditService.getByContract(contractId);
    return ApiResponse.ok(logs);
  }
}
