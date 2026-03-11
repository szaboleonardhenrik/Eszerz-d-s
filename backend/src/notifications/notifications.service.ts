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

  // ─── BRANDED EMAIL WRAPPER ─────────────────────────────
  private wrap(body: string, options?: { preheader?: string }): string {
    const preheader = options?.preheader || '';
    return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>Legitas</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8;">
    <tr><td align="center" style="padding:32px 16px;">

      <!-- Card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1A4B5F 0%,#198296 50%,#0F766E 100%);padding:28px 32px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="width:36px;height:36px;background:rgba(255,255,255,0.18);border-radius:10px;text-align:center;vertical-align:middle;">
                  <span style="color:#ffffff;font-weight:bold;font-size:16px;line-height:36px;">L</span>
                </td>
                <td style="padding-left:10px;">
                  <span style="color:#ffffff;font-weight:600;font-size:20px;letter-spacing:-0.3px;">Legit</span><span style="color:#46A0A0;font-weight:700;font-size:20px;">as</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 32px 24px;">
            ${body}
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 32px;">
            <div style="height:1px;background-color:#e8edf2;"></div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 28px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">
              <a href="${this.frontendUrl}/landing" style="color:#198296;text-decoration:none;font-weight:600;">legitas.hu</a>
              &nbsp;&middot;&nbsp;
              <a href="${this.frontendUrl}/settings/notifications" style="color:#9ca3af;text-decoration:underline;">Értesítések kezelése</a>
            </p>
            <p style="margin:0;font-size:11px;color:#c0c7ce;">
              &copy; ${new Date().getFullYear()} Legitas. Minden jog fenntartva.
            </p>
          </td>
        </tr>

      </table>
      <!-- /Card -->

    </td></tr>
  </table>
</body>
</html>`;
  }

  private btn(href: string, label: string, color = '#198296'): string {
    return `<div style="text-align:center;margin:28px 0 8px;">
  <a href="${href}" style="display:inline-block;background:${color};color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:-0.2px;box-shadow:0 2px 8px ${color}33;">
    ${label}
  </a>
</div>`;
  }

  private card(content: string, borderColor = '#e8edf2'): string {
    return `<div style="background:#f8fafb;padding:18px 20px;border-radius:10px;border-left:4px solid ${borderColor};margin:20px 0;">
  ${content}
</div>`;
  }

  private meta(label: string, value: string): string {
    return `<p style="margin:0 0 4px;font-size:13px;color:#6b8290;">${label}: <strong style="color:#1e2e38;">${value}</strong></p>`;
  }

  private hint(text: string): string {
    return `<p style="margin:20px 0 0;font-size:12px;color:#9ca3af;line-height:1.5;">${text}</p>`;
  }

  private greeting(name: string): string {
    return `<p style="margin:0 0 16px;font-size:16px;color:#1e2e38;font-weight:600;">Kedves ${name}!</p>`;
  }

  private text(content: string): string {
    return `<p style="margin:0 0 12px;font-size:15px;color:#3d5260;line-height:1.6;">${content}</p>`;
  }

  // ─── CONTRACT EMAILS ───────────────────────────────────

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
        html: this.wrap(
          `${this.greeting(params.signerName)}
           ${this.text(`<strong>${params.senderName}</strong> az alábbi szerződést küldte Önnek aláírásra:`)}
           ${this.card(`
             <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1e2e38;">${params.contractTitle}</p>
             ${this.meta('Határidő', params.expiresAt)}
           `, '#198296')}
           ${this.btn(params.signUrl, 'Megtekintés és aláírás')}
           ${this.hint('Ha nem Ön a címzett, kérjük hagyja figyelmen kívül ezt az emailt.')}`,
          { preheader: `${params.senderName} szerződést küldött Önnek: ${params.contractTitle}` },
        ),
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

    const statusColor = params.allSigned ? '#22c55e' : '#198296';
    const statusIcon = params.allSigned ? '&#10003;' : '&#9998;';
    const statusText = params.allSigned ? 'Minden fél aláírta' : 'Aláírás rögzítve';

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject,
        html: this.wrap(
          `${this.greeting(params.name)}
           <div style="text-align:center;margin:16px 0 20px;">
             <div style="display:inline-block;width:56px;height:56px;border-radius:50%;background:${statusColor}15;text-align:center;line-height:56px;">
               <span style="font-size:28px;color:${statusColor};">${statusIcon}</span>
             </div>
             <p style="margin:10px 0 0;font-size:14px;font-weight:600;color:${statusColor};text-transform:uppercase;letter-spacing:0.5px;">${statusText}</p>
           </div>
           ${this.card(`
             <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1e2e38;">${params.contractTitle}</p>
           `, statusColor)}
           ${params.allSigned
             ? this.text('A végleges, aláírt szerződés letölthető a fiókjában.')
             : this.text('A többi aláíró értesítése folyamatban van.')}`,
          { preheader: params.allSigned ? `Minden fél aláírta: ${params.contractTitle}` : `Aláírás rögzítve: ${params.contractTitle}` },
        ),
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
        html: this.wrap(
          `${this.greeting(params.signerName)}
           ${this.text(`A(z) <strong>${params.contractTitle}</strong> szerződés még aláírásra vár.`)}
           ${this.card(`
             <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1e2e38;">${params.contractTitle}</p>
             ${this.meta('Határidő', params.expiresAt)}
           `, '#D29B01')}
           ${this.btn(params.signUrl, 'Aláírás most', '#D29B01')}`,
          { preheader: `Emlékeztető: ${params.contractTitle} aláírásra vár` },
        ),
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
        html: this.wrap(params.html),
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
        html: this.wrap(
          `${this.greeting(params.name)}
           ${this.text('Köszönjük a regisztrációt a <strong>Legitason</strong>!')}
           ${this.text('Kérjük, erősítse meg az email címét az alábbi gombra kattintva:')}
           ${this.btn(params.verifyUrl, 'Email megerősítése')}
           ${this.hint('Ha nem Ön regisztrált, kérjük hagyja figyelmen kívül. A link 7 napig érvényes.')}`,
          { preheader: 'Erősítse meg email címét a Legitas fiókjához' },
        ),
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
        html: this.wrap(
          `${this.greeting(params.name)}
           ${this.text('Jelszó-visszaállítási kérelmet kaptunk a fiókjához.')}
           ${this.text('Az alábbi gombra kattintva állíthat be új jelszót:')}
           ${this.btn(params.resetUrl, 'Új jelszó beállítása')}
           ${this.hint('Ha nem Ön kérte, hagyja figyelmen kívül. A link 24 óráig érvényes.')}`,
          { preheader: 'Jelszó visszaállítás a Legitas fiókjához' },
        ),
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
        html: this.wrap(
          `${this.greeting(params.clientName)}
           ${this.text(`<strong>${params.senderName}</strong> árajánlatot küldött Önnek:`)}
           ${this.card(`
             <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1e2e38;">${params.quoteTitle}</p>
             ${params.quoteNumber ? this.meta('Azonosító', params.quoteNumber) : ''}
             <p style="margin:8px 0 0;font-size:22px;font-weight:800;color:#198296;">${params.totalAmount}</p>
             ${params.validUntil ? this.meta('Érvényes', `${params.validUntil}-ig`) : ''}
           `, '#198296')}
           ${this.btn(params.viewUrl, 'Ajánlat megtekintése')}
           ${this.hint('Az ajánlatot online megtekintheti, elfogadhatja vagy visszautasíthatja.')}`,
          { preheader: `Árajánlat: ${params.quoteTitle} — ${params.totalAmount}` },
        ),
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
        html: this.wrap(
          `${this.greeting(params.ownerName)}
           ${this.text(`<strong>${params.clientName}</strong> elfogadta az Ön ajánlatát:`)}
           ${this.card(`
             <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#166534;">${params.quoteTitle}</p>
             ${params.quoteNumber ? this.meta('Azonosító', params.quoteNumber) : ''}
           `, '#22c55e')}
           ${this.text('Javasoljuk, hogy hozza létre a szerződést az elfogadott ajánlat alapján.')}`,
          { preheader: `${params.clientName} elfogadta: ${params.quoteTitle}` },
        ),
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
        html: this.wrap(
          `${this.greeting(params.ownerName)}
           ${this.text(`<strong>${params.clientName}</strong> visszautasította az ajánlatot:`)}
           ${this.card(`
             <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#991b1b;">${params.quoteTitle}</p>
             ${params.quoteNumber ? this.meta('Azonosító', params.quoteNumber) : ''}
             ${params.reason ? `<p style="margin:8px 0 0;font-size:13px;color:#6b8290;"><strong>Indok:</strong> ${params.reason}</p>` : ''}
           `, '#ef4444')}`,
          { preheader: `${params.clientName} visszautasította: ${params.quoteTitle}` },
        ),
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
        html: this.wrap(
          `<p style="margin:0 0 16px;font-size:16px;color:#1e2e38;font-weight:600;">Portál hozzáférés</p>
           ${this.text('Az alábbi linkre kattintva megtekintheti az Önnek küldött szerződéseket:')}
           ${this.btn(params.portalUrl, 'Portál megnyitása')}
           ${this.hint('Ez a link 24 óráig érvényes. Ha nem Ön kérte, kérjük hagyja figyelmen kívül.')}`,
          { preheader: 'Megtekintheti az Önnek küldött szerződéseket' },
        ),
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
    const urgencyColor = params.daysLeft <= 7 ? '#ef4444' : params.daysLeft <= 14 ? '#D29B01' : '#198296';
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `Figyelmeztetés: "${params.contractTitle}" ${params.daysLeft} nap múlva lejár`,
        html: this.wrap(
          `${this.greeting(params.ownerName)}
           ${this.card(`
             <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1e2e38;">${params.contractTitle}</p>
             <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:${urgencyColor};">&#9200; ${params.daysLeft} nap van hátra a lejáratig</p>
           `, urgencyColor)}
           ${this.text('Kérjük, ellenőrizze a szerződés státuszát, és szükség esetén intézkedjen.')}
           ${this.btn(`${this.frontendUrl}/contracts/${params.contractId}`, 'Szerződés megtekintése', urgencyColor)}`,
          { preheader: `${params.contractTitle} — ${params.daysLeft} nap múlva lejár` },
        ),
      });
    } catch (error) {
      this.logger.error(`Failed to send expiry warning to ${params.to}`, error);
    }
  }
}
