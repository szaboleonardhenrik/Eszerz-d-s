import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private resend: Resend;
  private readonly logger = new Logger(NotificationsService.name);
  private fromEmail: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
    this.fromEmail = config.get<string>(
      'FROM_EMAIL',
      'SzerződésPortál <noreply@szerzodes-portal.hu>',
    );
  }

  async sendSigningInvitation(params: {
    to: string;
    signerName: string;
    senderName: string;
    contractTitle: string;
    signUrl: string;
    expiresAt: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `${params.senderName} szerződést küld aláírásra`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${params.signerName}!</h2>
            <p><strong>${params.senderName}</strong> az alábbi szerződést küldte Önnek aláírásra:</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0;">
              <h3 style="margin:0 0 8px 0;">${params.contractTitle}</h3>
              <p style="margin:0;color:#666;">Határidő: ${params.expiresAt}</p>
            </div>
            <a href="${params.signUrl}"
               style="display:inline-block;background:#2563eb;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Szerződés megtekintése és aláírása
            </a>
            <p style="margin-top:24px;font-size:12px;color:#999;">
              Ha nem Ön a címzett, kérjük hagyja figyelmen kívül ezt az emailt.
            </p>
          </div>
        `,
      });
      this.logger.log(`Signing invitation sent to ${params.to}`);
    } catch (error) {
      this.logger.error(`Failed to send signing invitation to ${params.to}`, error);
      throw error;
    }
  }

  async sendSignedConfirmation(params: {
    to: string;
    name: string;
    contractTitle: string;
    allSigned: boolean;
  }) {
    const subject = params.allSigned
      ? `Szerződés teljesítve – ${params.contractTitle}`
      : `Szerződés aláírva – ${params.contractTitle}`;

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${params.name}!</h2>
            ${
              params.allSigned
                ? `<p>A(z) <strong>${params.contractTitle}</strong> szerződést minden fél aláírta.</p>
                   <p>A végleges, aláírt példányt a fiókjában töltheti le.</p>`
                : `<p>Sikeresen aláírta a(z) <strong>${params.contractTitle}</strong> szerződést.</p>
                   <p>A többi aláíró értesítése folyamatban van.</p>`
            }
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send confirmation to ${params.to}`, error);
    }
  }

  async sendReminder(params: {
    to: string;
    signerName: string;
    contractTitle: string;
    signUrl: string;
    expiresAt: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `Emlékeztető: Függőben lévő szerződés aláírása`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${params.signerName}!</h2>
            <p>Emlékeztetjük, hogy a(z) <strong>${params.contractTitle}</strong> szerződés még aláírásra vár.</p>
            <p>Határidő: <strong>${params.expiresAt}</strong></p>
            <a href="${params.signUrl}"
               style="display:inline-block;background:#2563eb;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Aláírás most
            </a>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send reminder to ${params.to}`, error);
    }
  }
}
