import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditEventType =
  | 'contract_created'
  | 'email_sent'
  | 'document_viewed'
  | 'signed'
  | 'declined'
  | 'reminder_sent'
  | 'expired'
  | 'downloaded'
  | 'contract_duplicated'
  | 'contract_updated'
  | 'contract_archived'
  | 'contract_unarchived';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    contractId: string;
    signerId?: string;
    eventType: AuditEventType;
    eventData?: any;
    ipAddress?: string;
    userAgent?: string;
    documentHash?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        contractId: params.contractId,
        signerId: params.signerId,
        eventType: params.eventType,
        eventData: params.eventData ? JSON.stringify(params.eventData) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        documentHash: params.documentHash,
      },
    });
  }

  async getByContract(contractId: string) {
    return this.prisma.auditLog.findMany({
      where: { contractId },
      orderBy: { createdAt: 'asc' },
      include: { signer: { select: { name: true, email: true } } },
    });
  }

  async getByUser(
    userId: string,
    filters?: {
      contractId?: string;
      eventType?: string;
      dateFrom?: string;
      dateTo?: string;
    },
    page = 1,
    limit = 20,
  ) {
    const where: any = {
      contract: { ownerId: userId },
    };

    if (filters?.contractId) {
      where.contractId = filters.contractId;
    }
    if (filters?.eventType) {
      where.eventType = filters.eventType;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          signer: { select: { name: true, email: true } },
          contract: { select: { title: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async exportAuditLogs(
    userId: string,
    format: 'csv' | 'json',
    filters?: {
      contractId?: string;
      eventType?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const where: any = {
      contract: { ownerId: userId },
    };

    if (filters?.contractId) {
      where.contractId = filters.contractId;
    }
    if (filters?.eventType) {
      where.eventType = filters.eventType;
    }
    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        signer: { select: { name: true, email: true } },
        contract: { select: { title: true } },
      },
    });

    const eventTypeLabels: Record<string, string> = {
      contract_created: 'Szerződés létrehozva',
      email_sent: 'Email elküldve',
      document_viewed: 'Dokumentum megtekintve',
      signed: 'Aláírva',
      declined: 'Visszautasítva',
      reminder_sent: 'Emlékeztető küldve',
      expired: 'Lejárt',
      downloaded: 'Letöltve',
      contract_duplicated: 'Duplikálva',
      contract_updated: 'Módosítva',
      contract_archived: 'Archiválva',
      contract_unarchived: 'Visszaállítva',
    };

    const rows = logs.map((log) => ({
      datum: new Date(log.createdAt).toLocaleString('hu-HU', {
        timeZone: 'Europe/Budapest',
      }),
      szerzodes: log.contract?.title ?? '-',
      esemeny: eventTypeLabels[log.eventType] ?? log.eventType,
      alairo: log.signer ? `${log.signer.name} <${log.signer.email}>` : '-',
      ipCim: log.ipAddress ?? '-',
      dokumentumHash: log.documentHash ?? '-',
    }));

    if (format === 'json') {
      return { contentType: 'application/json', data: JSON.stringify(rows, null, 2) };
    }

    // CSV with UTF-8 BOM for Hungarian Excel
    const BOM = '\uFEFF';
    const headers = ['Dátum', 'Szerződés', 'Esemény', 'Aláíró', 'IP cím', 'Dokumentum hash'];
    const csvLines = [
      headers.join(','),
      ...rows.map((r) =>
        [r.datum, r.szerzodes, r.esemeny, r.alairo, r.ipCim, r.dokumentumHash]
          .map((v) => `"${v.replace(/"/g, '""')}"`)
          .join(','),
      ),
    ];
    const csvContent = BOM + csvLines.join('\r\n');

    return { contentType: 'text/csv', data: csvContent };
  }
}
