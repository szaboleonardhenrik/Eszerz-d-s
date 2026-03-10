import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class NotificationsService {
  private resend: Resend;
  private readonly logger = new Logger(NotificationsService.name);
  private fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY'));
    this.fromEmail = config.get<string>(
      'FROM_EMAIL',
      'Legitas <noreply@legitas.hu>',
    );
    this.frontendUrl = config.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  private get unsubscribeFooter(): string {
    return `<div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
  <p style="font-size: 12px; color: #9ca3af;">
    Ha nem szeretnél több ilyen értesítést kapni, módosítsd az
    <a href="${this.frontendUrl}/settings/notifications" style="color: #198296;">értesítési beállításaidat</a>.
  </p>
</div>`;
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
            ${this.unsubscribeFooter}
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send reminder to ${params.to}`, error);
    }
  }

  async sendOnboardingEmail(params: {
    to: string;
    name: string;
    subject: string;
    html: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: params.subject,
        html: params.html + this.unsubscribeFooter,
      });
      this.logger.log(`Onboarding email sent to ${params.to}: "${params.subject}"`);
    } catch (error) {
      this.logger.error(`Failed to send onboarding email to ${params.to}`, error);
    }
  }

  // ─── AUTH NOTIFICATIONS ──────────────────────────────

  async sendVerificationEmail(params: {
    to: string;
    name: string;
    verifyUrl: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: 'Email cím megerősítése – Legitas',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${params.name}!</h2>
            <p>Köszönjük a regisztrációt a <strong>Legitason</strong>!</p>
            <p>Kérjük, erősítse meg az email címét az alábbi gombra kattintva:</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${params.verifyUrl}"
                 style="display:inline-block;background:#198296;color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Email megerősítése
              </a>
            </div>
            <p style="font-size:12px;color:#999;">
              Ha nem Ön regisztrált, kérjük hagyja figyelmen kívül ezt az emailt.
              A link 7 napig érvényes.
            </p>
          </div>
        `,
      });
      this.logger.log(`Verification email sent to ${params.to}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${params.to}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(params: {
    to: string;
    name: string;
    resetUrl: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: 'Jelszó visszaállítás – Legitas',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${params.name}!</h2>
            <p>Jelszó-visszaállítási kérelmet kaptunk a fiókjához.</p>
            <p>Az alábbi gombra kattintva állíthat be új jelszót:</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${params.resetUrl}"
                 style="display:inline-block;background:#198296;color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Új jelszó beállítása
              </a>
            </div>
            <p style="font-size:12px;color:#999;">
              Ha nem Ön kérte a jelszó-visszaállítást, hagyja figyelmen kívül ezt az emailt.
              A link 24 óráig érvényes.
            </p>
          </div>
        `,
      });
      this.logger.log(`Password reset email sent to ${params.to}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${params.to}`, error);
      throw error;
    }
  }

  // ─── QUOTE NOTIFICATIONS ─────────────────────────────

  async sendQuoteToClient(params: {
    to: string;
    clientName: string;
    senderName: string;
    quoteTitle: string;
    quoteNumber: string;
    totalAmount: string;
    viewUrl: string;
    validUntil: string | null;
  }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `Árajánlat: ${params.quoteTitle} – ${params.senderName}`,
        html: `
          <div style="font-family:'Segoe UI',sans-serif;max-width:600px;margin:0 auto;color:#333;">
            <div style="background:#198296;padding:24px 32px;border-radius:12px 12px 0 0;">
              <h1 style="color:white;margin:0;font-size:22px;">Árajánlat</h1>
              <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:14px;">${params.senderName}</p>
            </div>
            <div style="background:white;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
              <p style="font-size:16px;">Kedves ${params.clientName}!</p>
              <p><strong>${params.senderName}</strong> árajánlatot küldött Önnek:</p>
              <div style="background:#f8f9fa;padding:20px;border-radius:8px;margin:20px 0;">
                <h3 style="margin:0 0 8px;color:#198296;">${params.quoteTitle}</h3>
                ${params.quoteNumber ? `<p style="margin:0 0 4px;font-size:13px;color:#666;">Azonosító: ${params.quoteNumber}</p>` : ''}
                <p style="margin:0 0 4px;font-size:20px;font-weight:bold;color:#198296;">${params.totalAmount}</p>
                ${params.validUntil ? `<p style="margin:0;font-size:13px;color:#666;">Érvényes: ${params.validUntil}-ig</p>` : ''}
              </div>
              <div style="text-align:center;margin:24px 0;">
                <a href="${params.viewUrl}"
                   style="display:inline-block;background:#198296;color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:15px;">
                  Ajánlat megtekintése
                </a>
              </div>
              <p style="font-size:13px;color:#999;margin-top:24px;">
                Az ajánlatot online megtekintheti, elfogadhatja vagy visszautasíthatja a fenti gomb segítségével.
              </p>
              ${this.unsubscribeFooter}
            </div>
          </div>
        `,
      });
      this.logger.log(`Quote email sent to ${params.to}`);
    } catch (error) {
      this.logger.error(`Failed to send quote email to ${params.to}`, error);
      throw error;
    }
  }

  async sendQuoteAccepted(params: {
    to: string;
    ownerName: string;
    quoteTitle: string;
    clientName: string;
    quoteNumber: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `Ajánlat elfogadva: ${params.quoteTitle}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${params.ownerName}!</h2>
            <p>Nagyszerű hír! <strong>${params.clientName}</strong> elfogadta az Ön ajánlatát:</p>
            <div style="background:#f0fdf4;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #22c55e;">
              <h3 style="margin:0 0 4px;color:#166534;">${params.quoteTitle}</h3>
              ${params.quoteNumber ? `<p style="margin:0;font-size:13px;color:#666;">Azonosító: ${params.quoteNumber}</p>` : ''}
            </div>
            <p>Javasoljuk, hogy hozza létre a szerződést az elfogadott ajánlat alapján.</p>
            ${this.unsubscribeFooter}
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send quote accepted notification to ${params.to}`, error);
    }
  }

  async sendQuoteDeclined(params: {
    to: string;
    ownerName: string;
    quoteTitle: string;
    clientName: string;
    quoteNumber: string;
    reason: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `Ajánlat visszautasítva: ${params.quoteTitle}`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${params.ownerName}!</h2>
            <p><strong>${params.clientName}</strong> visszautasította az ajánlatot:</p>
            <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:16px 0;border-left:4px solid #ef4444;">
              <h3 style="margin:0 0 4px;color:#991b1b;">${params.quoteTitle}</h3>
              ${params.quoteNumber ? `<p style="margin:0 0 4px;font-size:13px;color:#666;">Azonosító: ${params.quoteNumber}</p>` : ''}
              ${params.reason ? `<p style="margin:8px 0 0;font-size:13px;"><strong>Indok:</strong> ${params.reason}</p>` : ''}
            </div>
            ${this.unsubscribeFooter}
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send quote declined notification to ${params.to}`, error);
    }
  }

  async sendPortalAccessToken(params: {
    to: string;
    portalUrl: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: 'Portál hozzáférés – Legitas',
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Portál hozzáférés</h2>
            <p>Az alábbi linkre kattintva megtekintheti az Önnek küldött szerződéseket:</p>
            <div style="text-align:center;margin:24px 0;">
              <a href="${params.portalUrl}"
                 style="display:inline-block;background:#198296;color:white;padding:14px 40px;border-radius:8px;text-decoration:none;font-weight:bold;">
                Portál megnyitása
              </a>
            </div>
            <p style="font-size:12px;color:#999;">
              Ez a link 24 óráig érvényes. Ha nem Ön kérte, kérjük hagyja figyelmen kívül.
            </p>
          </div>
        `,
      });
      this.logger.log(`Portal access token sent to ${params.to}`);
    } catch (error) {
      this.logger.error(`Failed to send portal access token to ${params.to}`, error);
      throw error;
    }
  }

  async sendExpiryWarning(params: {
    to: string;
    ownerName: string;
    contractTitle: string;
    daysLeft: number;
    contractId: string;
  }) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3000');
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `Figyelmeztetés: "${params.contractTitle}" ${params.daysLeft} nap múlva lejár`,
        html: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
            <h2>Kedves ${params.ownerName}!</h2>
            <p>A(z) <strong>${params.contractTitle}</strong> szerződés <strong>${params.daysLeft} nap múlva lejár</strong>.</p>
            <p>Kérjük, ellenőrizze a szerződés státuszát, és szükség esetén intézkedjen.</p>
            <a href="${frontendUrl}/contracts/${params.contractId}"
               style="display:inline-block;background:#D29B01;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">
              Szerződés megtekintése
            </a>
            ${this.unsubscribeFooter}
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send expiry warning to ${params.to}`, error);
    }
  }
}
