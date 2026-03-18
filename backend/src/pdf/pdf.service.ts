import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import puppeteer from 'puppeteer';
import * as QRCode from 'qrcode';

export interface PdfBranding {
  logoUrl?: string;
  companyName?: string;
  brandColor?: string; // hex color like #198296
}

@Injectable()
export class PdfService {
  async generatePdf(html: string, title: string, branding?: PdfBranding, verificationHash?: string, documentHash?: string): Promise<Buffer> {
    let qrBlock = '';
    if (verificationHash) {
      const verifyUrl = `${process.env.FRONTEND_URL || 'https://legitas.hu'}/verify/${verificationHash}`;
      try {
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: 80,
          margin: 1,
          color: { dark: '#1a1a1a', light: '#ffffff' },
        });
        qrBlock = `
          <div style="margin-top:32px;page-break-inside:avoid;display:flex;align-items:center;gap:12px;padding:12px 16px;border:1px solid #e5e7eb;border-radius:8px;background:#fafafa;">
            <img src="${qrDataUrl}" style="width:80px;height:80px;flex-shrink:0;" />
            <div style="font-size:10px;color:#6b7280;line-height:1.5;">
              <strong style="color:#374151;">Ellenorizze:</strong><br/>
              legitas.hu/verify/${this.escapeHtml(verificationHash)}<br/>
              <span style="font-size:9px;color:#9ca3af;">Ez a szerzodes a Legitas rendszerben lett letrehozva es hitelesitve.</span>
            </div>
          </div>`;
      } catch {
        // QR generation failed, skip
      }
    }

    const fullHtml = this.wrapInDocument(html + qrBlock, title, branding);
    // Security note: --no-sandbox is required when running as root in Docker/Linux.
    // The production Dockerfile runs as non-root (USER nestjs), but Chromium still
    // needs --no-sandbox in many containerised environments.
    // --disable-dev-shm-usage avoids /dev/shm size issues in Docker (uses /tmp instead).
    // --disable-gpu is not needed for headless PDF generation and avoids GPU-related crashes.
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });

    const footerName = branding?.companyName ? this.escapeHtml(branding.companyName) : 'Legitas';

    try {
      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', bottom: '25mm', left: '20mm', right: '20mm' },
        printBackground: true,
        displayHeaderFooter: true,
        footerTemplate: `
          <div style="font-size:8px;width:100%;text-align:center;color:#999;padding:0 20mm;">
            ${footerName} &mdash; Elektronikusan generált dokumentum${documentHash ? ` &mdash; SHA-256: ${documentHash.slice(0, 16)}...` : ''} &mdash;
            <span class="pageNumber"></span>/<span class="totalPages"></span>. oldal
          </div>
        `,
        headerTemplate: '<div></div>',
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  async addSignatureToPdf(
    html: string,
    title: string,
    signatures: Array<{
      name: string;
      role: string;
      signatureImageBase64?: string;
      stampImageBase64?: string;
      typedName?: string;
      signedAt: string;
      method: string;
      companyName?: string;
      companyTaxNumber?: string;
      companyAddress?: string;
      ipAddress?: string;
    }>,
    branding?: PdfBranding,
    verificationHash?: string,
    auditMeta?: {
      registrationNumber?: string;
      documentHash?: string;
      variablesHash?: string;
      createdAt?: string;
      tsaTimestamp?: string;
      tsaAuthority?: string;
      tsaSerialNumber?: string;
    },
  ): Promise<Buffer> {
    let signatureBlock = '<div class="signatures" style="margin-top:40px;page-break-inside:avoid;">';
    signatureBlock += '<h3 style="border-bottom:2px solid #2563eb;padding-bottom:8px;color:#1a1a1a;font-size:16px;">Aláírások</h3>';
    signatureBlock += '<div style="display:flex;flex-wrap:wrap;gap:40px;margin-top:16px;">';

    for (const sig of signatures) {
      const methodLabel = sig.method === 'simple' ? 'Egyszerű e-aláírás' : sig.method === 'dap' ? 'DÁP eAláírás' : 'Minősített aláírás';
      let signatureVisual = '';
      if (sig.signatureImageBase64) {
        signatureVisual = `<div style="display:flex;align-items:flex-end;gap:12px;margin:8px 0;">
          <img src="${sig.signatureImageBase64}" style="height:60px;display:block;" />
          ${sig.stampImageBase64 ? `<img src="${sig.stampImageBase64}" style="height:50px;display:block;opacity:0.85;" />` : ''}
        </div>`;
      } else if (sig.typedName) {
        signatureVisual = `<div style="display:flex;align-items:flex-end;gap:12px;margin:8px 0;">
          <p style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-style:italic;margin:0;color:#1a1a1a;">${this.escapeHtml(sig.typedName)}</p>
          ${sig.stampImageBase64 ? `<img src="${sig.stampImageBase64}" style="height:50px;display:block;opacity:0.85;" />` : ''}
        </div>`;
      } else if (sig.stampImageBase64) {
        signatureVisual = `<img src="${sig.stampImageBase64}" style="height:50px;margin:8px 0;display:block;opacity:0.85;" />`;
      }

      let companyBlock = '';
      if (sig.companyName || sig.companyTaxNumber || sig.companyAddress) {
        companyBlock = '<div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;">';
        if (sig.companyName) companyBlock += `<p style="margin:0 0 2px;font-weight:600;color:#374151;">${this.escapeHtml(sig.companyName)}</p>`;
        if (sig.companyTaxNumber) companyBlock += `<p style="margin:0 0 2px;">Adószám: ${this.escapeHtml(sig.companyTaxNumber)}</p>`;
        if (sig.companyAddress) companyBlock += `<p style="margin:0;">Székhely: ${this.escapeHtml(sig.companyAddress)}</p>`;
        companyBlock += '</div>';
      }

      signatureBlock += `
        <div style="min-width:220px;border:1px solid #e5e7eb;border-radius:8px;padding:16px;background:#fafafa;">
          <p style="margin:0;font-weight:600;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${this.escapeHtml(sig.role || 'Aláíró')}</p>
          ${signatureVisual}
          <p style="margin:4px 0 0 0;font-weight:600;color:#1a1a1a;">${this.escapeHtml(sig.name)}</p>
          <p style="margin:4px 0 0 0;font-size:11px;color:#9ca3af;">
            ${sig.signedAt} &bull; ${methodLabel}
          </p>
          ${companyBlock}
        </div>
      `;
    }

    signatureBlock += '</div></div>';

    // ── Audit & integrity block in PDF ──
    let auditBlock = '';
    const docHash = auditMeta?.documentHash;
    if (docHash || auditMeta?.registrationNumber) {
      const rows: string[] = [];
      if (auditMeta?.registrationNumber) rows.push(`<tr><td style="font-weight:600;width:160px;">Iktatószám</td><td style="font-family:monospace;font-size:11px;">${this.escapeHtml(auditMeta.registrationNumber)}</td></tr>`);
      if (auditMeta?.createdAt) rows.push(`<tr><td style="font-weight:600;">Létrehozva</td><td>${this.escapeHtml(auditMeta.createdAt)}</td></tr>`);
      rows.push(`<tr><td style="font-weight:600;">Aláírók száma</td><td>${signatures.length} fő</td></tr>`);
      for (const sig of signatures) {
        const ip = sig.ipAddress ? ` (IP: ${this.escapeHtml(sig.ipAddress)})` : '';
        rows.push(`<tr><td style="font-weight:600;">${this.escapeHtml(sig.name)}</td><td>${sig.signedAt} &bull; ${sig.method === 'simple' ? 'SES' : sig.method === 'dap' ? 'AES/DÁP' : 'QES'}${ip}</td></tr>`);
      }
      if (docHash) rows.push(`<tr><td style="font-weight:600;">Dokumentum hash</td><td style="font-family:monospace;font-size:10px;word-break:break-all;">${this.escapeHtml(docHash)}</td></tr>`);
      if (auditMeta?.variablesHash) rows.push(`<tr><td style="font-weight:600;">Változók hash</td><td style="font-family:monospace;font-size:10px;word-break:break-all;">${this.escapeHtml(auditMeta.variablesHash)}</td></tr>`);
      rows.push(`<tr><td style="font-weight:600;">Hash algoritmus</td><td>SHA-256</td></tr>`);
      if (auditMeta?.tsaTimestamp) rows.push(`<tr><td style="font-weight:600;">Hiteles időbélyeg (TSA)</td><td>${this.escapeHtml(auditMeta.tsaTimestamp)}</td></tr>`);
      if (auditMeta?.tsaAuthority) rows.push(`<tr><td style="font-weight:600;">Időbélyeg szolgáltató</td><td>${this.escapeHtml(auditMeta.tsaAuthority)}</td></tr>`);
      if (auditMeta?.tsaSerialNumber) rows.push(`<tr><td style="font-weight:600;">TSA sorozatszám</td><td style="font-family:monospace;font-size:10px;">${this.escapeHtml(auditMeta.tsaSerialNumber)}</td></tr>`);

      auditBlock = `
        <div style="margin-top:32px;page-break-inside:avoid;border:1px solid #d1d5db;border-radius:8px;overflow:hidden;">
          <div style="background:#f3f4f6;padding:10px 16px;border-bottom:1px solid #d1d5db;">
            <strong style="font-size:12px;color:#374151;text-transform:uppercase;letter-spacing:0.5px;">Hitelesítési adatok &mdash; Audit összefoglaló</strong>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;color:#374151;">
            ${rows.map(r => r).join('')}
          </table>
          <div style="padding:8px 16px;background:#fefce8;border-top:1px solid #d1d5db;font-size:9px;color:#92400e;">
            Ez a dokumentum a Legitas platformon (legitas.hu) lett létrehozva és elektronikusan aláírva.
            Az egyszerű elektronikus aláírás (SES) az eIDAS rendelet (EU 910/2014) értelmében joghatással bír.
          </div>
        </div>`;
    }

    const fullHtml = html + signatureBlock + auditBlock;
    return this.generatePdf(fullHtml, title, branding, verificationHash, auditMeta?.documentHash);
  }

  hashDocument(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private wrapInDocument(html: string, title: string, branding?: PdfBranding): string {
    const brandColor = branding?.brandColor || '#111827';
    const h1Color = branding?.brandColor || '#111827';
    const h2Color = branding?.brandColor || '#1f2937';

    let brandingHeader = '';
    if (branding && (branding.logoUrl || branding.companyName)) {
      const logoHtml = branding.logoUrl
        ? `<img src="${this.escapeHtml(branding.logoUrl)}" style="max-height:40px;object-fit:contain;" />`
        : '';
      const nameHtml = branding.companyName
        ? `<span style="font-size:16px;font-weight:600;color:${brandColor};">${this.escapeHtml(branding.companyName)}</span>`
        : '';
      brandingHeader = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid ${brandColor};">
          <div>${logoHtml}</div>
          <div>${nameHtml}</div>
        </div>`;
    }

    return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 13px;
      line-height: 1.7;
      color: #1a1a1a;
      max-width: 100%;
    }
    h1 {
      font-size: 22px;
      text-align: center;
      margin-bottom: 24px;
      color: ${h1Color};
      letter-spacing: -0.3px;
    }
    h2 {
      font-size: 15px;
      margin-top: 24px;
      margin-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
      color: ${h2Color};
    }
    h3 { font-size: 14px; margin-top: 16px; color: #374151; }
    p { margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    td, th { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; font-size: 13px; }
    th { background: #f9fafb; font-weight: 600; }
    tr:nth-child(even) td { background: #fafafa; }
    strong { color: #111827; }
    .variable-highlight { background: #fff3cd; padding: 2px 4px; border-radius: 2px; }
    .signatures { margin-top: 40px; page-break-inside: avoid; }
  </style>
</head>
<body>${brandingHeader}${html}</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
