import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import puppeteer from 'puppeteer';

export interface PdfBranding {
  logoUrl?: string;
  companyName?: string;
  brandColor?: string; // hex color like #198296
}

@Injectable()
export class PdfService {
  async generatePdf(html: string, title: string, branding?: PdfBranding): Promise<Buffer> {
    const fullHtml = this.wrapInDocument(html, title, branding);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const footerName = branding?.companyName ? this.escapeHtml(branding.companyName) : 'SzerződésPortál';

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
            ${footerName} &mdash; Elektronikusan generált dokumentum &mdash;
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
      typedName?: string;
      signedAt: string;
      method: string;
    }>,
    branding?: PdfBranding,
  ): Promise<Buffer> {
    let signatureBlock = '<div class="signatures" style="margin-top:40px;page-break-inside:avoid;">';
    signatureBlock += '<h3 style="border-bottom:2px solid #2563eb;padding-bottom:8px;color:#1a1a1a;font-size:16px;">Aláírások</h3>';
    signatureBlock += '<div style="display:flex;flex-wrap:wrap;gap:40px;margin-top:16px;">';

    for (const sig of signatures) {
      const methodLabel = sig.method === 'simple' ? 'Egyszerű e-aláírás' : sig.method === 'dap' ? 'DÁP eAláírás' : 'Minősített aláírás';
      let signatureVisual = '';
      if (sig.signatureImageBase64) {
        signatureVisual = `<img src="${sig.signatureImageBase64}" style="height:60px;margin:8px 0;display:block;" />`;
      } else if (sig.typedName) {
        signatureVisual = `<p style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-style:italic;margin:8px 0;color:#1a1a1a;">${this.escapeHtml(sig.typedName)}</p>`;
      }

      signatureBlock += `
        <div style="min-width:220px;border:1px solid #e5e7eb;border-radius:8px;padding:16px;background:#fafafa;">
          <p style="margin:0;font-weight:600;font-size:13px;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${this.escapeHtml(sig.role || 'Aláíró')}</p>
          ${signatureVisual}
          <p style="margin:4px 0 0 0;font-weight:600;color:#1a1a1a;">${this.escapeHtml(sig.name)}</p>
          <p style="margin:4px 0 0 0;font-size:11px;color:#9ca3af;">
            ${sig.signedAt} &bull; ${methodLabel}
          </p>
        </div>
      `;
    }

    signatureBlock += '</div></div>';
    const fullHtml = html + signatureBlock;
    return this.generatePdf(fullHtml, title, branding);
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
