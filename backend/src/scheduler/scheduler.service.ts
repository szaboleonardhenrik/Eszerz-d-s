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

  /** Daily at 10:00 AM - send onboarding drip emails (day 1, 3, 7) */
  @Cron('0 10 * * *')
  async sendOnboardingEmails() {
    this.logger.log('Running onboarding drip campaign job...');

    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );

    const onboardingSteps = [
      {
        daysAgo: 1,
        subject: 'Üdvözöljük a SzerződésPortálon!',
        buildHtml: (name: string) => `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${name}!</h2>
            <p>Köszönjük, hogy regisztrált a <strong>SzerződésPortálon</strong>! Örülünk, hogy velünk van.</p>
            <p>Íme néhány tipp az induláshoz:</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
              <ul style="margin:0;padding-left:20px;line-height:1.8;">
                <li><strong>Hozza létre első szerződését</strong> – válasszon a 15+ professzionális sablon közül</li>
                <li><strong>Töltse ki a profilját</strong> – adja meg céges adatait a gyorsabb kitöltéshez</li>
                <li><strong>Hívja meg aláíróit</strong> – küldjön aláírási felkérést e-mailben</li>
              </ul>
            </div>
            <a href="${frontendUrl}/dashboard"
               style="display:inline-block;background:#2563eb;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Irány az Irányítópult
            </a>
            <p style="margin-top:24px;font-size:12px;color:#999;">
              Ha kérdése van, bátran írjon nekünk – szívesen segítünk!
            </p>
          </div>
        `,
      },
      {
        daysAgo: 3,
        subject: 'Próbálja ki a sablonokat!',
        buildHtml: (name: string) => `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${name}!</h2>
            <p>Tudta, hogy a SzerződésPortálon <strong>15+ kész szerződéssablon</strong> várja?</p>
            <p>Munkajogi, B2B, ingatlan, IT, GDPR és sok más – mind magyar jogszabályoknak megfelelően.</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
              <h3 style="margin:0 0 8px 0;">Népszerű sablonok:</h3>
              <ul style="margin:0;padding-left:20px;line-height:1.8;">
                <li>Munkaszerződés</li>
                <li>Megbízási szerződés</li>
                <li>Vállalkozási szerződés</li>
                <li>Titoktartási megállapodás (NDA)</li>
              </ul>
            </div>
            <p>Válasszon sablont, töltse ki a wizard segítségével, és percek alatt kész a szerződése!</p>
            <a href="${frontendUrl}/templates"
               style="display:inline-block;background:#2563eb;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Sablonok böngészése
            </a>
            <p style="margin-top:24px;font-size:12px;color:#999;">
              Ha kérdése van, bátran írjon nekünk – szívesen segítünk!
            </p>
          </div>
        `,
      },
      {
        daysAgo: 7,
        subject: 'Hozza ki a legtöbbet a SzerződésPortálból!',
        buildHtml: (name: string) => `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${name}!</h2>
            <p>Már egy hete velünk van – ideje felfedezni a <strong>haladó funkciókat</strong>!</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
              <h3 style="margin:0 0 12px 0;">Tudta, hogy ezek is elérhetők?</h3>
              <ul style="margin:0;padding-left:20px;line-height:1.8;">
                <li><strong>AI elemzés</strong> – A mesterséges intelligencia átnézi szerződését és javaslatokat tesz</li>
                <li><strong>Csapatkezelés</strong> – Hívja meg kollégáit és dolgozzanak együtt</li>
                <li><strong>API integráció</strong> – Kösse össze saját rendszereivel API kulcsokkal</li>
                <li><strong>Webhookok</strong> – Kapjon valós idejű értesítéseket más rendszerekbe</li>
              </ul>
            </div>
            <a href="${frontendUrl}/settings"
               style="display:inline-block;background:#2563eb;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Beállítások felfedezése
            </a>
            <p style="margin-top:24px;font-size:12px;color:#999;">
              Kérdése van a haladó funkciókról? Írjon nekünk bátran!
            </p>
          </div>
        `,
      },
    ];

    let totalSent = 0;

    for (const step of onboardingSteps) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - step.daysAgo);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const users = await this.prisma.user.findMany({
        where: {
          createdAt: { gte: dayStart, lte: dayEnd },
        },
        select: { email: true, name: true },
      });

      for (const user of users) {
        try {
          await this.notificationsService.sendOnboardingEmail({
            to: user.email,
            name: user.name,
            subject: step.subject,
            html: step.buildHtml(user.name),
          });
          totalSent++;
        } catch (error) {
          this.logger.error(
            `Failed to send day-${step.daysAgo} onboarding email to ${user.email}`,
            error,
          );
        }
      }
    }

    this.logger.log(`Onboarding drip campaign: sent ${totalSent} emails`);
  }

  /** Daily at 8:00 AM - send contract expiry warnings (30, 14, 7 days before) */
  @Cron('0 8 * * *')
  async sendExpiryWarnings() {
    this.logger.log('Running contract expiry warning job...');

    const now = new Date();
    const warningDays = [30, 14, 7];

    for (const days of warningDays) {
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      const expiringContracts = await this.prisma.contract.findMany({
        where: {
          status: { in: ['sent', 'partially_signed', 'draft'] },
          expiresAt: { gte: dayStart, lte: dayEnd },
        },
        include: {
          owner: { select: { email: true, name: true, notifyOnExpire: true } },
        },
      });

      for (const contract of expiringContracts) {
        if (!contract.owner.notifyOnExpire) continue;

        try {
          await this.notificationsService.sendExpiryWarning({
            to: contract.owner.email,
            ownerName: contract.owner.name,
            contractTitle: contract.title,
            daysLeft: days,
            contractId: contract.id,
          });
          this.logger.log(`Expiry warning (${days}d) sent for contract ${contract.id}`);
        } catch (error) {
          this.logger.error(`Failed to send expiry warning for ${contract.id}`, error);
        }
      }
    }
  }
}
