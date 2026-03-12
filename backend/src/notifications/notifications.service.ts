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
    const year = new Date().getFullYear();
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
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</div>` : ''}

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f4f8;">
    <tr><td align="center" style="padding:40px 16px 32px;">

      <!-- Top Logo Banner -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr>
          <td style="padding-bottom:24px;text-align:center;">
            <a href="${this.frontendUrl}" style="text-decoration:none;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;background:linear-gradient(135deg,#0c4a3e 0%,#134e3a 50%,#115e45 100%);border-radius:14px;padding:12px 28px;">
                <tr>
                  <td style="width:40px;height:40px;background:rgba(255,255,255,0.15);border-radius:10px;text-align:center;vertical-align:middle;">
                    <span style="color:#ffffff;font-weight:800;font-size:18px;line-height:40px;">L</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#ffffff;font-weight:700;font-size:24px;letter-spacing:-0.5px;">Legit</span><span style="color:#6ee7b7;font-weight:800;font-size:24px;">as</span>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
      </table>

      <!-- Main Card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">

        <!-- Gradient Top Bar -->
        <tr>
          <td style="height:4px;background:linear-gradient(90deg,#198296 0%,#0F766E 50%,#198296 100%);font-size:0;line-height:0;">&nbsp;</td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            ${body}
          </td>
        </tr>

        <!-- Separator -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0 20%,#e2e8f0 80%,transparent);"></div>
          </td>
        </tr>

        <!-- Features Bar -->
        <tr>
          <td style="padding:24px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="width:33%;padding:0 6px;">
                  <div style="background:#f0fdf4;border:1px solid #d1fae5;border-radius:12px;padding:16px 8px;">
                    <div style="width:40px;height:40px;background:#dcfce7;border-radius:10px;margin:0 auto 8px;text-align:center;line-height:40px;font-size:18px;">&#128274;</div>
                    <p style="margin:0;font-size:11px;font-weight:600;color:#166534;line-height:1.3;">Biztonságos<br>platform</p>
                  </div>
                </td>
                <td align="center" style="width:33%;padding:0 6px;">
                  <div style="background:#eff6ff;border:1px solid #dbeafe;border-radius:12px;padding:16px 8px;">
                    <div style="width:40px;height:40px;background:#dbeafe;border-radius:10px;margin:0 auto 8px;text-align:center;line-height:40px;font-size:18px;">&#9889;</div>
                    <p style="margin:0;font-size:11px;font-weight:600;color:#1e40af;line-height:1.3;">Gyors<br>aláírás</p>
                  </div>
                </td>
                <td align="center" style="width:33%;padding:0 6px;">
                  <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px 8px;">
                    <div style="width:40px;height:40px;background:#e0f2fe;border-radius:10px;margin:0 auto 8px;text-align:center;line-height:40px;font-size:18px;">&#128196;</div>
                    <p style="margin:0;font-size:11px;font-weight:600;color:#0c4a6e;line-height:1.3;">Digitális<br>archiválás</p>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Separator -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,#e2e8f0 20%,#e2e8f0 80%,transparent);"></div>
          </td>
        </tr>

        <!-- Footer Links -->
        <tr>
          <td style="padding:24px 40px 16px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="padding:0 12px;">
                  <a href="${this.frontendUrl}" style="color:#198296;text-decoration:none;font-size:12px;font-weight:600;">Legitas.hu</a>
                </td>
                <td style="color:#cbd5e1;font-size:12px;">|</td>
                <td style="padding:0 12px;">
                  <a href="${this.frontendUrl}/blog" style="color:#64748b;text-decoration:none;font-size:12px;">Blog</a>
                </td>
                <td style="color:#cbd5e1;font-size:12px;">|</td>
                <td style="padding:0 12px;">
                  <a href="${this.frontendUrl}/pricing" style="color:#64748b;text-decoration:none;font-size:12px;">Árak</a>
                </td>
                <td style="color:#cbd5e1;font-size:12px;">|</td>
                <td style="padding:0 12px;">
                  <a href="${this.frontendUrl}/settings/notifications" style="color:#64748b;text-decoration:none;font-size:12px;">Értesítések</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Copyright -->
        <tr>
          <td style="padding:0 40px 28px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.5;">
              &copy; ${year} Legitas — Elektronikus szerződéskezelő platform<br>
              Magyar KKV-k számára tervezve
            </p>
          </td>
        </tr>
      </table>

      <!-- Trust bar -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin-top:20px;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0c4a3e 0%,#134e3a 40%,#115e45 100%);border-radius:12px;overflow:hidden;">
              <tr>
                <td style="padding:18px 24px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="width:33%;padding:0 4px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                          <tr>
                            <td style="vertical-align:middle;padding-right:6px;">
                              <div style="width:24px;height:24px;background:rgba(255,255,255,0.12);border-radius:6px;text-align:center;line-height:24px;font-size:12px;">&#128274;</div>
                            </td>
                            <td style="vertical-align:middle;">
                              <p style="margin:0;font-size:11px;font-weight:600;color:#a7f3d0;">SSL titkosítás</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td align="center" style="width:33%;padding:0 4px;border-left:1px solid rgba(255,255,255,0.1);border-right:1px solid rgba(255,255,255,0.1);">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                          <tr>
                            <td style="vertical-align:middle;padding-right:6px;">
                              <div style="width:24px;height:24px;background:rgba(255,255,255,0.12);border-radius:6px;text-align:center;line-height:24px;font-size:12px;">&#128737;</div>
                            </td>
                            <td style="vertical-align:middle;">
                              <p style="margin:0;font-size:11px;font-weight:600;color:#a7f3d0;">GDPR</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td align="center" style="width:33%;padding:0 4px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                          <tr>
                            <td style="vertical-align:middle;padding-right:6px;">
                              <div style="width:24px;height:24px;background:rgba(255,255,255,0.12);border-radius:6px;text-align:center;line-height:24px;font-size:12px;">&#9989;</div>
                            </td>
                            <td style="vertical-align:middle;">
                              <p style="margin:0;font-size:11px;font-weight:600;color:#a7f3d0;">eIDAS</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

    </td></tr>
  </table>
</body>
</html>`;
  }

  private btn(href: string, label: string, color = '#198296'): string {
    const hoverBg = color === '#198296' ? '#146d7d' : color;
    return `<div style="text-align:center;margin:32px 0 12px;">
  <a href="${href}" style="display:inline-block;background:${color};color:#ffffff;padding:16px 44px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:-0.2px;box-shadow:0 4px 14px ${color}40;transition:background 0.3s;">
    ${label}
  </a>
</div>
<div style="text-align:center;">
  <p style="margin:0;font-size:11px;color:#94a3b8;">vagy másolja be a böngészőbe:</p>
  <p style="margin:4px 0 0;font-size:10px;color:#198296;word-break:break-all;max-width:400px;display:inline-block;">${href}</p>
</div>`;
  }

  private btnSimple(href: string, label: string, color = '#198296'): string {
    return `<div style="text-align:center;margin:32px 0 12px;">
  <a href="${href}" style="display:inline-block;background:${color};color:#ffffff;padding:16px 44px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:-0.2px;box-shadow:0 4px 14px ${color}40;">
    ${label}
  </a>
</div>`;
  }

  private card(content: string, borderColor = '#e2e8f0'): string {
    return `<div style="background:#f8fafc;padding:20px 24px;border-radius:12px;border-left:4px solid ${borderColor};margin:24px 0;">
  ${content}
</div>`;
  }

  private infoBox(icon: string, title: string, description: string, bgColor = '#f0f9ff', borderColor = '#bae6fd'): string {
    return `<div style="background:${bgColor};border:1px solid ${borderColor};border-radius:12px;padding:18px 20px;margin:24px 0;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td style="vertical-align:top;padding-right:14px;width:42px;">
        <div style="width:42px;height:42px;background:#ffffff;border-radius:10px;text-align:center;line-height:42px;font-size:20px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">${icon}</div>
      </td>
      <td style="vertical-align:top;">
        <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#1e293b;">${title}</p>
        <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">${description}</p>
      </td>
    </tr>
  </table>
</div>`;
  }

  private statusBadge(label: string, color: string, bgColor: string): string {
    return `<div style="text-align:center;margin:24px 0;">
  <div style="display:inline-block;background:${bgColor};border:1px solid ${color}30;border-radius:20px;padding:6px 20px;">
    <span style="font-size:13px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.5px;">${label}</span>
  </div>
</div>`;
  }

  private successIcon(): string {
    return `<div style="text-align:center;margin:20px 0 28px;">
  <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#dcfce7 0%,#bbf7d0 100%);text-align:center;line-height:72px;box-shadow:0 4px 16px rgba(34,197,94,0.2);">
    <span style="font-size:36px;color:#16a34a;">&#10003;</span>
  </div>
</div>`;
  }

  private warningIcon(): string {
    return `<div style="text-align:center;margin:20px 0 28px;">
  <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);text-align:center;line-height:72px;box-shadow:0 4px 16px rgba(234,179,8,0.2);">
    <span style="font-size:36px;color:#d97706;">&#9888;</span>
  </div>
</div>`;
  }

  private signingIcon(): string {
    return `<div style="text-align:center;margin:20px 0 28px;">
  <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%);text-align:center;line-height:72px;box-shadow:0 4px 16px rgba(25,130,150,0.2);">
    <span style="font-size:36px;color:#198296;">&#9998;</span>
  </div>
</div>`;
  }

  private meta(label: string, value: string): string {
    return `<tr>
  <td style="padding:6px 0;font-size:13px;color:#64748b;width:120px;vertical-align:top;">${label}</td>
  <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">${value}</td>
</tr>`;
  }

  private metaTable(...rows: string[]): string {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${rows.join('')}</table>`;
  }

  private hint(text: string): string {
    return `<p style="margin:24px 0 0;font-size:12px;color:#94a3b8;line-height:1.6;border-top:1px solid #f1f5f9;padding-top:16px;">${text}</p>`;
  }

  private greeting(name: string): string {
    return `<p style="margin:0 0 20px;font-size:18px;color:#1e293b;font-weight:700;">Kedves ${name}!</p>`;
  }

  private text(content: string): string {
    return `<p style="margin:0 0 16px;font-size:15px;color:#475569;line-height:1.7;">${content}</p>`;
  }

  private stepsList(steps: { icon: string; text: string }[]): string {
    return `<div style="margin:24px 0;">
  ${steps.map((s, i) => `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:${i < steps.length - 1 ? '12' : '0'}px;">
    <tr>
      <td style="width:36px;vertical-align:top;">
        <div style="width:32px;height:32px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;text-align:center;line-height:32px;font-size:14px;">${s.icon}</div>
      </td>
      <td style="vertical-align:middle;padding-left:12px;">
        <p style="margin:0;font-size:14px;color:#475569;line-height:1.5;">${s.text}</p>
      </td>
    </tr>
  </table>`).join('')}
</div>`;
  }

  // ─── CONTRACT EMAILS ───────────────────────────────────

  async sendSigningInvitation(params: {
    to: string;
    signerName: string;
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    contractTitle: string;
    signUrl: string;
    expiresAt: string;
    registrationNumber?: string;
    documentType?: string;
    documentHash?: string;
    variablesHash?: string;
    totalSigners?: number;
  }) {
    const signerCount = params.totalSigners ?? 1;

    // Build sender contact section
    const senderContactRows = [
      this.meta('Küldő neve', `<strong>${params.senderName}</strong>`),
      this.meta('Küldő email', `<a href="mailto:${params.senderEmail}" style="color:#198296;text-decoration:none;">${params.senderEmail}</a>`),
    ];
    if (params.senderPhone) {
      senderContactRows.push(this.meta('Küldő telefon', params.senderPhone));
    }

    // Build document info section
    const docInfoRows = [
      ...(params.registrationNumber ? [this.meta('Iktatószám', `<code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:12px;color:#1e293b;font-weight:700;">${params.registrationNumber}</code>`)] : []),
      this.meta('Dokumentum típusa', params.documentType ?? params.contractTitle),
      ...(params.variablesHash ? [this.meta('Változó adatok lenyomata', `<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:10px;color:#64748b;word-break:break-all;">${params.variablesHash}</code>`)] : []),
      ...(params.documentHash ? [this.meta('Dokumentum lenyomata', `<code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:10px;color:#64748b;word-break:break-all;">${params.documentHash}</code>`)] : []),
      ...(params.documentHash ? [this.meta('Hash-algoritmus', 'SHA-256')] : []),
    ];

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `Aláírásra vár: ${params.contractTitle}`,
        html: this.wrap(
          `${this.signingIcon()}
           <p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#198296;text-transform:uppercase;letter-spacing:1px;">Új szerződés érkezett</p>
           <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${params.contractTitle}</p>

           ${this.greeting(params.signerName)}
           ${this.text(`<strong>${params.senderName}</strong> elektronikus aláírásra küldött Önnek egy szerződést a Legitas platformon keresztül. A dokumentum biztonságos, titkosított környezetben tekinthető meg és írható alá.`)}

           ${this.infoBox('&#9888;', 'Fontos tudnivalók', `Ahhoz, hogy érvénybe lépjen a szerződés, minden fél (${signerCount} aláíró) aláírására szükség van.<br><br>Abban az esetben, ha módosulna a szerződés, a rendszer automatikusan törli az összes aláírást — újra alá kell írnia minden félnek.`, '#fffbeb', '#fde68a')}

           ${this.card(`
             <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#198296;text-transform:uppercase;letter-spacing:1px;">Szerződés adatai</p>
             ${this.metaTable(
               this.meta('Dokumentum', `<strong>${params.contractTitle}</strong>`),
               this.meta('Feladó', params.senderName),
               this.meta('Határidő', params.expiresAt),
               this.meta('Aláírók száma', `${signerCount} fél`),
               this.meta('Státusz', '<span style="color:#d97706;font-weight:700;">Aláírásra vár</span>'),
             )}
           `, '#198296')}

           ${this.text('Az aláírás néhány percet vesz igénybe. A folyamat során az alábbi lépések várják:')}
           ${this.stepsList([
             { icon: '&#128100;', text: '<strong>Adatok megadása</strong> — vállalkozása alapadatai (cégnév, adószám, székhely)' },
             { icon: '&#128196;', text: '<strong>Szerződés áttekintése</strong> — a teljes dokumentum elolvasása' },
             { icon: '&#9998;', text: '<strong>Elektronikus aláírás</strong> — kézírásos vagy gépelt aláírás' },
           ])}

           ${this.btn(params.signUrl, '&#9998;  Szerződés megtekintése és aláírása')}

           ${this.infoBox('&#128274;', 'Biztonságos aláírás', 'Az aláírás SSL titkosított csatornán, GDPR és eIDAS szabványoknak megfelelően történik. Személyes adatait biztonságban kezeljük.')}

           <!-- Sender contact info -->
           <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin:24px 0;">
             <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Küldő elérhetőségei</p>
             ${this.metaTable(...senderContactRows)}
           </div>

           <!-- Document metadata -->
           <div style="background:#f0f4f8;border:1px solid #cbd5e1;border-radius:12px;padding:20px 24px;margin:24px 0;">
             <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:1px;">Dokumentum adatok</p>
             ${this.metaTable(...docInfoRows)}
           </div>

           ${this.hint('Ha nem Ön a címzett, kérjük hagyja figyelmen kívül ezt az emailt. A link 7 napig érvényes. Amennyiben kérdése van, forduljon közvetlenül a feladóhoz.')}`,
          { preheader: `${params.senderName} szerződést küldött Önnek: ${params.contractTitle} — kattintson az aláíráshoz` },
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
      ? `Szerződés teljesítve! – ${params.contractTitle}`
      : `Aláírás sikeresen rögzítve – ${params.contractTitle}`;

    const signedDate = new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject,
        html: this.wrap(
          params.allSigned
            ? `${this.successIcon()}
               <p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Minden fél aláírta</p>
               <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${params.contractTitle}</p>

               ${this.greeting(params.name)}
               ${this.text('Örömmel értesítjük, hogy a fenti szerződést <strong>minden érintett fél sikeresen aláírta</strong>. A szerződés jogilag érvényes és hatályba lépett.')}

               ${this.card(`
                 <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Teljesített szerződés</p>
                 ${this.metaTable(
                   this.meta('Dokumentum', `<strong>${params.contractTitle}</strong>`),
                   this.meta('Teljesítés', signedDate),
                   this.meta('Státusz', '<span style="color:#16a34a;font-weight:700;">&#10003; Teljesítve</span>'),
                 )}
               `, '#16a34a')}

               ${this.infoBox('&#128230;', 'Végleges dokumentum', 'Az aláírt szerződés PDF formátumban letölthető a Legitas fiókjából, illetve hamarosan külön emailben is megkapja csatolmányként.', '#f0fdf4', '#bbf7d0')}

               ${this.btnSimple(`${this.frontendUrl}/dashboard`, 'Fiók megnyitása')}

               ${this.hint('A dokumentum SHA-256 hash-sel van hitelesítve, így annak sértetlensége bármikor ellenőrizhető. Javasoljuk, hogy a végleges PDF-et mentse el saját nyilvántartásába is.')}`

            : `${this.signingIcon()}
               ${this.statusBadge('Aláírás rögzítve', '#198296', '#e0f2fe')}
               <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${params.contractTitle}</p>

               ${this.greeting(params.name)}
               ${this.text('Az Ön aláírása sikeresen rögzítésre került a fenti szerződésen. A többi aláíró fél értesítése automatikusan megtörtént.')}

               ${this.card(`
                 ${this.metaTable(
                   this.meta('Dokumentum', `<strong>${params.contractTitle}</strong>`),
                   this.meta('Aláírás ideje', signedDate),
                   this.meta('Státusz', '<span style="color:#d97706;font-weight:700;">&#9202; Várakozás a többi aláíróra</span>'),
                 )}
               `, '#198296')}

               ${this.text('Amint az összes fél aláírta a dokumentumot, értesítjük, és a végleges, aláírt szerződést PDF formátumban megkapja emailben.')}

               ${this.infoBox('&#128276;', 'Mi történik ezután?', 'A rendszer automatikusan nyomon követi az aláírásokat, és szükség esetén emlékeztetőt küld a még nem aláírt feleknek. Önnek nincs további teendője.')}

               ${this.btnSimple(`${this.frontendUrl}/dashboard`, 'Fiók megnyitása')}

               ${this.hint('Ha kérdése van a szerződéssel kapcsolatban, forduljon közvetlenül a feladóhoz. A Legitas platform csak a dokumentumkezelést biztosítja.')}`,
          { preheader: params.allSigned ? `Kész! Minden fél aláírta: ${params.contractTitle}` : `Aláírása rögzítve: ${params.contractTitle} — várakozás a többi félre` },
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
        subject: `Emlékeztető: ${params.contractTitle} aláírásra vár`,
        html: this.wrap(
          `${this.warningIcon()}
           <p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#d97706;text-transform:uppercase;letter-spacing:1px;">Emlékeztető</p>
           <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${params.contractTitle}</p>

           ${this.greeting(params.signerName)}
           ${this.text(`Szeretnénk emlékeztetni, hogy a fenti szerződés még <strong>aláírásra vár</strong>. A dokumentum a Legitas platformon keresztül néhány perc alatt aláírható.`)}

           ${this.card(`
             ${this.metaTable(
               this.meta('Dokumentum', `<strong>${params.contractTitle}</strong>`),
               this.meta('Határidő', `<span style="color:#d97706;font-weight:700;">${params.expiresAt}</span>`),
               this.meta('Státusz', '<span style="color:#d97706;font-weight:700;">&#9202; Aláírásra vár</span>'),
             )}
           `, '#d97706')}

           ${this.text('Kérjük, kattintson az alábbi gombra a szerződés megtekintéséhez és aláírásához. A folyamat mindössze néhány percet vesz igénybe.')}

           ${this.btn(params.signUrl, '&#9998;  Aláírás most', '#d97706')}

           ${this.hint('Ha már aláírta a szerződést, kérjük hagyja figyelmen kívül ezt az emlékeztetőt. Ha technikai problémába ütközik, próbálja meg másik böngészőben.')}`,
          { preheader: `Emlékeztető: ${params.contractTitle} még aláírásra vár — kattintson a linkre` },
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
        subject: 'Erősítse meg email címét – Legitas',
        html: this.wrap(
          `<div style="text-align:center;margin:20px 0 28px;">
             <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%);text-align:center;line-height:72px;box-shadow:0 4px 16px rgba(25,130,150,0.2);">
               <span style="font-size:36px;">&#128231;</span>
             </div>
           </div>
           <p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#198296;text-transform:uppercase;letter-spacing:1px;">Email megerősítés</p>
           <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">Üdvözöljük a Legitason!</p>

           ${this.greeting(params.name)}
           ${this.text('Köszönjük, hogy regisztrált a Legitas elektronikus szerződéskezelő platformra! Az induláshoz kérjük, erősítse meg az email címét az alábbi gombra kattintva.')}

           ${this.btnSimple(params.verifyUrl, '&#10003;  Email cím megerősítése')}

           ${this.text('A megerősítés után azonnal használhatja a platformot:')}
           ${this.stepsList([
             { icon: '&#128221;', text: 'Szerződések készítése professzionális sablonokból' },
             { icon: '&#9998;', text: 'Elektronikus aláírás küldése partnereinek' },
             { icon: '&#128202;', text: 'Szerződések nyomon követése és archiválása' },
           ])}

           ${this.hint('A megerősítő link 7 napig érvényes. Ha nem Ön regisztrált, kérjük hagyja figyelmen kívül — fiók nem jön létre a megerősítés nélkül.')}`,
          { preheader: 'Erősítse meg email címét és kezdjen el szerződéseket kezelni a Legitason!' },
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
          `<div style="text-align:center;margin:20px 0 28px;">
             <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);text-align:center;line-height:72px;box-shadow:0 4px 16px rgba(234,179,8,0.2);">
               <span style="font-size:36px;">&#128272;</span>
             </div>
           </div>
           <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">Jelszó visszaállítás</p>

           ${this.greeting(params.name)}
           ${this.text('Jelszó-visszaállítási kérelmet kaptunk az Ön Legitas fiókjához. Ha Ön kezdeményezte, kattintson az alábbi gombra az új jelszó beállításához.')}

           ${this.btnSimple(params.resetUrl, '&#128272;  Új jelszó beállítása')}

           ${this.infoBox('&#128737;&#65039;', 'Biztonsági tipp', 'Válasszon legalább 8 karakteres jelszót, amely tartalmaz kis- és nagybetűket, számot és speciális karaktert.', '#fefce8', '#fde68a')}

           ${this.hint('Ha nem Ön kérte a jelszó visszaállítását, kérjük hagyja figyelmen kívül ezt az emailt — jelszava változatlan marad. A link 24 óráig érvényes.')}`,
          { preheader: 'Jelszó visszaállítás a Legitas fiókjához — kattintson a linkre' },
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
          `<div style="text-align:center;margin:20px 0 28px;">
             <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%);text-align:center;line-height:72px;box-shadow:0 4px 16px rgba(25,130,150,0.2);">
               <span style="font-size:36px;">&#128176;</span>
             </div>
           </div>
           <p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#198296;text-transform:uppercase;letter-spacing:1px;">Árajánlat érkezett</p>
           <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${params.quoteTitle}</p>

           ${this.greeting(params.clientName)}
           ${this.text(`<strong>${params.senderName}</strong> árajánlatot küldött Önnek a Legitas platformon keresztül. Az ajánlatot online megtekintheti, elfogadhatja vagy visszautasíthatja.`)}

           ${this.card(`
             <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#198296;text-transform:uppercase;letter-spacing:1px;">Ajánlat részletei</p>
             ${this.metaTable(
               this.meta('Ajánlat', `<strong>${params.quoteTitle}</strong>`),
               params.quoteNumber ? this.meta('Azonosító', params.quoteNumber) : '',
               this.meta('Feladó', params.senderName),
               params.validUntil ? this.meta('Érvényes', `${params.validUntil}-ig`) : '',
             )}
             <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">
               <p style="margin:0;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Összeg</p>
               <p style="margin:4px 0 0;font-size:28px;font-weight:800;color:#198296;">${params.totalAmount}</p>
             </div>
           `, '#198296')}

           ${this.btn(params.viewUrl, '&#128196;  Ajánlat megtekintése')}

           ${this.hint('Az ajánlatot megtekintés után elfogadhatja vagy visszautasíthatja. Ha kérdése van, forduljon közvetlenül a feladóhoz.')}`,
          { preheader: `Árajánlat: ${params.quoteTitle} — ${params.totalAmount} — ${params.senderName}` },
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
        subject: `Ajánlat elfogadva! – ${params.quoteTitle}`,
        html: this.wrap(
          `${this.successIcon()}
           <p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Ajánlat elfogadva</p>
           <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${params.quoteTitle}</p>

           ${this.greeting(params.ownerName)}
           ${this.text(`Nagyszerű hír! <strong>${params.clientName}</strong> elfogadta az Ön árajánlatát. Javasoljuk, hogy a következő lépésként hozza létre a szerződést az elfogadott ajánlat alapján.`)}

           ${this.card(`
             ${this.metaTable(
               this.meta('Ajánlat', `<strong>${params.quoteTitle}</strong>`),
               params.quoteNumber ? this.meta('Azonosító', params.quoteNumber) : '',
               this.meta('Ügyfél', params.clientName),
               this.meta('Státusz', '<span style="color:#16a34a;font-weight:700;">&#10003; Elfogadva</span>'),
             )}
           `, '#16a34a')}

           ${this.text('A következő lépésként hozzon létre egy szerződést az elfogadott ajánlat alapján:')}
           ${this.stepsList([
             { icon: '1&#65039;&#8419;', text: 'Nyissa meg az ajánlatot a fiókjában' },
             { icon: '2&#65039;&#8419;', text: 'Kattintson a "Szerződés létrehozása" gombra' },
             { icon: '3&#65039;&#8419;', text: 'Küldje el aláírásra az ügyfélnek' },
           ])}

           ${this.btnSimple(`${this.frontendUrl}/quotes`, '&#128196;  Ajánlatok kezelése')}`,
          { preheader: `${params.clientName} elfogadta az ajánlatát: ${params.quoteTitle}` },
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
        subject: `Ajánlat visszautasítva – ${params.quoteTitle}`,
        html: this.wrap(
          `<div style="text-align:center;margin:20px 0 28px;">
             <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#fee2e2 0%,#fecaca 100%);text-align:center;line-height:72px;box-shadow:0 4px 16px rgba(239,68,68,0.2);">
               <span style="font-size:36px;color:#dc2626;">&#10007;</span>
             </div>
           </div>
           <p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:1px;">Ajánlat visszautasítva</p>
           <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${params.quoteTitle}</p>

           ${this.greeting(params.ownerName)}
           ${this.text(`Sajnálattal értesítjük, hogy <strong>${params.clientName}</strong> visszautasította a fenti ajánlatot.`)}

           ${this.card(`
             ${this.metaTable(
               this.meta('Ajánlat', `<strong>${params.quoteTitle}</strong>`),
               params.quoteNumber ? this.meta('Azonosító', params.quoteNumber) : '',
               this.meta('Ügyfél', params.clientName),
               this.meta('Státusz', '<span style="color:#dc2626;font-weight:700;">&#10007; Visszautasítva</span>'),
             )}
             ${params.reason ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e2e8f0;">
               <p style="margin:0 0 4px;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Indoklás</p>
               <p style="margin:0;font-size:14px;color:#475569;font-style:italic;">"${params.reason}"</p>
             </div>` : ''}
           `, '#ef4444')}

           ${this.text('Lehetősége van módosított ajánlatot küldeni, vagy felvenni a kapcsolatot az ügyféllel a részletek egyeztetése érdekében.')}

           ${this.btnSimple(`${this.frontendUrl}/quotes`, '&#128196;  Ajánlatok kezelése')}`,
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
          `<div style="text-align:center;margin:20px 0 28px;">
             <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#e0f2fe 0%,#bae6fd 100%);text-align:center;line-height:72px;box-shadow:0 4px 16px rgba(25,130,150,0.2);">
               <span style="font-size:36px;">&#128194;</span>
             </div>
           </div>
           <p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#198296;text-transform:uppercase;letter-spacing:1px;">Partner portál</p>
           <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">Hozzáférés a szerződéseihez</p>

           ${this.text('Az alábbi gombra kattintva megtekintheti az Önnek küldött szerződéseket. A portálon egy helyen láthatja az összes dokumentumot.')}

           ${this.btnSimple(params.portalUrl, '&#128194;  Portál megnyitása')}

           ${this.infoBox('&#128274;', 'Biztonságos hozzáférés', 'A portál link személyre szól és 24 óráig érvényes. Minden hozzáférés naplózva van a biztonság érdekében.')}

           ${this.hint('Ha nem Ön kérte a portál hozzáférést, kérjük hagyja figyelmen kívül ezt az emailt.')}`,
          { preheader: 'Megtekintheti az Önnek küldött szerződéseket a Legitas portálon' },
        ),
      });
      this.logger.log(`Portal access token sent to ${params.to}`);
    } catch (error) {
      this.logger.error(`Failed to send portal access token to ${params.to}`, error);
      throw error;
    }
  }

  async sendSignedContractPdf(params: {
    to: string;
    name: string;
    contractTitle: string;
    pdfBuffer: Buffer;
  }) {
    const signedDate = new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `Aláírt szerződés kész – ${params.contractTitle}`,
        html: this.wrap(
          `${this.successIcon()}
           <p style="text-align:center;margin:0 0 8px;font-size:13px;font-weight:600;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Szerződés teljesítve</p>
           <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${params.contractTitle}</p>

           ${this.greeting(params.name)}
           ${this.text('A fenti szerződést minden érintett fél sikeresen aláírta. A végleges, aláírt dokumentumot PDF formátumban csatoltuk ehhez az emailhez.')}

           ${this.card(`
             <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1px;">Végleges dokumentum</p>
             ${this.metaTable(
               this.meta('Dokumentum', `<strong>${params.contractTitle}</strong>`),
               this.meta('Teljesítés', signedDate),
               this.meta('Státusz', '<span style="color:#16a34a;font-weight:700;">&#10003; Teljesítve</span>'),
               this.meta('Formátum', 'PDF csatolmány'),
             )}
           `, '#16a34a')}

           ${this.infoBox('&#128230;', 'PDF csatolmány', 'A végleges, aláírt szerződés ehhez az emailhez van csatolva. Kérjük, töltse le és mentse el saját nyilvántartásába is.', '#f0fdf4', '#bbf7d0')}

           ${this.infoBox('&#128274;', 'Dokumentum hitelesítés', 'A szerződés SHA-256 kriptográfiai hash-sel van hitelesítve. Az eredeti dokumentum sértetlensége bármikor ellenőrizhető a Legitas platformon.', '#f0f9ff', '#bae6fd')}

           ${this.btnSimple(`${this.frontendUrl}/dashboard`, '&#128200;  Fiók megnyitása')}

           ${this.hint('Javasoljuk, hogy a csatolt PDF-et mentse el egy biztonságos helyre. Amennyiben a dokumentumot harmadik fél számára is hozzáférhetővé kell tennie, azt bármikor megteheti a Legitas fiókjából.')}`,
          { preheader: `Kész! ${params.contractTitle} — az aláírt szerződés PDF-ben csatolva` },
        ),
        attachments: [
          {
            filename: `${params.contractTitle.replace(/[^a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ\s-]/g, '')}_alairva.pdf`,
            content: params.pdfBuffer,
          },
        ],
      });
      this.logger.log(`Signed PDF sent to ${params.to}`);
    } catch (error) {
      this.logger.error(`Failed to send signed PDF to ${params.to}`, error);
    }
  }

  async sendExpiryWarning(params: {
    to: string;
    ownerName: string;
    contractTitle: string;
    daysLeft: number;
    contractId: string;
  }) {
    const urgencyColor = params.daysLeft <= 7 ? '#dc2626' : params.daysLeft <= 14 ? '#d97706' : '#198296';
    const urgencyBg = params.daysLeft <= 7 ? '#fef2f2' : params.daysLeft <= 14 ? '#fefce8' : '#f0f9ff';
    const urgencyBorder = params.daysLeft <= 7 ? '#fecaca' : params.daysLeft <= 14 ? '#fde68a' : '#bae6fd';
    const urgencyLabel = params.daysLeft <= 7 ? 'Sürgős' : params.daysLeft <= 14 ? 'Figyelmeztetés' : 'Értesítés';

    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `${urgencyLabel}: „${params.contractTitle}" ${params.daysLeft} nap múlva lejár`,
        html: this.wrap(
          `${params.daysLeft <= 7 ? `<div style="text-align:center;margin:20px 0 28px;">
             <div style="display:inline-block;width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#fee2e2 0%,#fecaca 100%);text-align:center;line-height:72px;box-shadow:0 4px 16px rgba(239,68,68,0.2);">
               <span style="font-size:36px;">&#9200;</span>
             </div>
           </div>` : this.warningIcon()}
           ${this.statusBadge(`${params.daysLeft} nap van hátra`, urgencyColor, urgencyBg)}
           <p style="text-align:center;margin:0 0 28px;font-size:22px;font-weight:800;color:#1e293b;">${params.contractTitle}</p>

           ${this.greeting(params.ownerName)}
           ${this.text(`Szeretnénk felhívni a figyelmét, hogy a fenti szerződés <strong style="color:${urgencyColor};">${params.daysLeft} nap múlva lejár</strong>. Kérjük, ellenőrizze a szerződés státuszát, és szükség esetén intézkedjen.`)}

           ${this.card(`
             ${this.metaTable(
               this.meta('Dokumentum', `<strong>${params.contractTitle}</strong>`),
               this.meta('Hátralévő idő', `<span style="color:${urgencyColor};font-weight:700;">${params.daysLeft} nap</span>`),
             )}
           `, urgencyColor)}

           ${this.infoBox('&#128161;', 'Teendők', 'Ellenőrizze, hogy minden aláíró fél aláírta-e a dokumentumot. Ha szükséges, küldjön emlékeztetőt a még nem aláírt feleknek.', urgencyBg, urgencyBorder)}

           ${this.btnSimple(`${this.frontendUrl}/contracts/${params.contractId}`, '&#128196;  Szerződés megtekintése', urgencyColor)}

           ${this.hint('Ez egy automatikus értesítés a Legitas rendszerből. Az értesítési beállításait a fiókjában módosíthatja.')}`,
          { preheader: `${params.contractTitle} — ${params.daysLeft} nap múlva lejár — intézkedjen!` },
        ),
      });
    } catch (error) {
      this.logger.error(`Failed to send expiry warning to ${params.to}`, error);
    }
  }

  // ─── SIGNER OTP VERIFICATION ────────────────────────────
  async sendSignerOtp(params: {
    to: string;
    signerName: string;
    otpCode: string;
    contractTitle: string;
    expiresInMinutes: number;
  }) {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: params.to,
        subject: `${params.otpCode} — Hitelesítési kód az aláíráshoz`,
        html: this.wrap(
          `${this.greeting(params.signerName)}

           ${this.text('Az alábbi egyszer használatos kóddal hitelesítheti személyazonosságát a szerződés aláírása előtt:')}

           <div style="text-align:center;margin:28px 0;">
             <div style="display:inline-block;background:linear-gradient(135deg,#f0f9ff,#e0f2fe);border:2px solid #7dd3fc;border-radius:16px;padding:20px 40px;">
               <p style="margin:0;font-size:36px;font-weight:800;letter-spacing:12px;color:#0c4a6e;font-family:'Courier New',monospace;">${params.otpCode}</p>
             </div>
             <p style="margin:10px 0 0;font-size:12px;color:#94a3b8;">A kód <strong>${params.expiresInMinutes} percig</strong> érvényes</p>
           </div>

           ${this.card(`
             ${this.metaTable(
               this.meta('Szerződés', `<strong>${params.contractTitle}</strong>`),
               this.meta('Email cím', params.to),
             )}
           `)}

           ${this.infoBox('&#128274;', 'Biztonsági figyelmeztetés', 'Ha nem Ön kérte ezt a kódot, kérjük hagyja figyelmen kívül ezt az emailt. Soha ne ossza meg a kódot mással.', '#fef3c7', '#fde68a')}

           ${this.hint('Ez egy automatikus üzenet a Legitas e-aláírási rendszeréből. A kód csak egyszer használható.')}`,
          { preheader: `${params.otpCode} — Hitelesítési kód a(z) ${params.contractTitle} aláírásához` },
        ),
      });
    } catch (error) {
      this.logger.error(`Failed to send signer OTP to ${params.to}`, error);
    }
  }
}
