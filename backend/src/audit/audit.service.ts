import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
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
  | 'contract_unarchived'
  | 'audit_accessed'
  | 'audit_exported';

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
    // ── Hash chain: fetch the latest audit entry for this contract ──
    const previous = await this.prisma.auditLog.findFirst({
      where: { contractId: params.contractId },
      orderBy: { createdAt: 'desc' },
      select: { integrityHash: true },
    });
    const previousHash = previous?.integrityHash ?? 'GENESIS';

    const now = new Date();
    const integrityHash = this.computeIntegrityHash({
      previousHash,
      action: params.eventType,
      userId: params.signerId ?? '',
      contractId: params.contractId,
      timestamp: now.toISOString(),
    });

    return this.prisma.auditLog.create({
      data: {
        contractId: params.contractId,
        signerId: params.signerId,
        eventType: params.eventType,
        eventData: params.eventData ? JSON.stringify(params.eventData) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        documentHash: params.documentHash,
        previousHash,
        integrityHash,
        createdAt: now,
      },
    });
  }

  /**
   * Compute SHA-256 integrity hash for audit chain.
   * Hash = SHA-256(previousHash + action + userId + contractId + timestamp)
   */
  private computeIntegrityHash(input: {
    previousHash: string;
    action: string;
    userId: string;
    contractId: string;
    timestamp: string;
  }): string {
    const payload = `${input.previousHash}|${input.action}|${input.userId}|${input.contractId}|${input.timestamp}`;
    return crypto.createHash('sha256').update(payload).digest('hex');
  }

  /**
   * Meta-audit: log who accessed or exported audit logs.
   * Uses a separate "meta" contract ID convention if no specific contract.
   */
  async logMetaAudit(params: {
    userId: string;
    eventType: 'audit_accessed' | 'audit_exported';
    eventData?: any;
    ipAddress?: string;
    userAgent?: string;
    contractId?: string;
  }) {
    // If a specific contract is targeted, log against it
    if (params.contractId) {
      return this.log({
        contractId: params.contractId,
        eventType: params.eventType,
        eventData: { ...params.eventData, userId: params.userId },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    }
    // For general audit access (listing all), we need a contractId
    // Log against the first contract found for the user, or skip
    const firstContract = await this.prisma.contract.findFirst({
      where: { ownerId: params.userId },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (firstContract) {
      return this.log({
        contractId: firstContract.id,
        eventType: params.eventType,
        eventData: { ...params.eventData, userId: params.userId, scope: 'all' },
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    }
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
      audit_accessed: 'Audit napló megtekintve',
      audit_exported: 'Audit napló exportálva',
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
