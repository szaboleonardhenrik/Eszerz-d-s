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
}
