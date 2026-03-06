import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService,
  ) {}

  /** Daily at 9:00 AM - send reminders for pending signers */
  @Cron('0 9 * * *')
  async sendPendingReminders() {
    this.logger.log('Running pending signer reminder job...');

    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const pendingSigners = await this.prisma.signer.findMany({
      where: {
        status: 'pending',
        contract: {
          status: { in: ['sent', 'partially_signed'] },
          updatedAt: { lte: twoDaysAgo },
        },
        tokenExpiresAt: { gt: now },
      },
      include: { contract: true },
    });

    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    for (const signer of pendingSigners) {
      try {
        await this.notificationsService.sendReminder({
          to: signer.email,
          signerName: signer.name,
          contractTitle: signer.contract.title,
          signUrl: `${frontendUrl}/sign/${signer.signToken}`,
          expiresAt:
            signer.tokenExpiresAt?.toLocaleDateString('hu-HU') ?? '',
        });
        this.logger.log(`Reminder sent to ${signer.email}`);
      } catch (error) {
        this.logger.error(
          `Failed to send reminder to ${signer.email}`,
          error,
        );
      }
    }

    this.logger.log(`Sent ${pendingSigners.length} reminders`);
  }

  /** Hourly - expire tokens and update contract status */
  @Cron('0 * * * *')
  async expireTokens() {
    this.logger.log('Running token expiration job...');

    const now = new Date();

    // Find expired pending signers
    const expiredSigners = await this.prisma.signer.findMany({
      where: {
        status: 'pending',
        tokenExpiresAt: { lt: now },
      },
      select: { id: true, contractId: true },
    });

    if (expiredSigners.length === 0) return;

    // Update all expired signers
    await this.prisma.signer.updateMany({
      where: {
        id: { in: expiredSigners.map((s) => s.id) },
      },
      data: { status: 'expired' },
    });

    // Check each affected contract
    const contractIds = [...new Set(expiredSigners.map((s) => s.contractId))];

    for (const contractId of contractIds) {
      const signers = await this.prisma.signer.findMany({
        where: { contractId },
      });

      const allDone = signers.every(
        (s) => s.status === 'expired' || s.status === 'declined',
      );

      if (allDone) {
        await this.prisma.contract.update({
          where: { id: contractId },
          data: { status: 'expired' },
        });
        this.logger.log(`Contract ${contractId} marked as expired`);
      }
    }

    this.logger.log(`Expired ${expiredSigners.length} signer tokens`);
  }
}
