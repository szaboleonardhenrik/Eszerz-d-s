import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  async generatePdf(html: string, title: string): Promise<Buffer> {
    const fullHtml = this.wrapInDocument(html, title);
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        margin: { top: '20mm', bottom: '25mm', left: '20mm', right: '20mm' },
        printBackground: true,
        displayHeaderFooter: true,
        footerTemplate: `
          <div style="font-size:8px;width:100%;text-align:center;color:#666;">
            Generálta: SzerződésPortál | Dokumentum hash: <span class="documentHash"></span> |
            <span class="pageNumber"></span>/<span class="totalPages"></span>
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
      signedAt: string;
      method: string;
    }>,
  ): Promise<Buffer> {
    let signatureBlock = '<div class="signatures" style="margin-top:40px;page-break-inside:avoid;">';
    signatureBlock += '<h3 style="border-bottom:1px solid #ccc;padding-bottom:8px;">Aláírások</h3>';
    signatureBlock += '<div style="display:flex;flex-wrap:wrap;gap:40px;">';

    for (const sig of signatures) {
      signatureBlock += `
        <div style="min-width:200px;">
          <p style="margin:0;font-weight:bold;">${this.escapeHtml(sig.role || 'Aláíró')}</p>
          ${sig.signatureImageBase64 ? `<img src="${sig.signatureImageBase64}" style="height:60px;margin:8px 0;" />` : ''}
          <p style="margin:4px 0;">${this.escapeHtml(sig.name)}</p>
          <p style="margin:0;font-size:12px;color:#666;">
            ${sig.signedAt} | ${sig.method === 'simple' ? 'Egyszerű e-aláírás' : sig.method === 'dap' ? 'DÁP eAláírás' : 'Minősített aláírás'}
          </p>
        </div>
      `;
    }

    signatureBlock += '</div></div>';
    const fullHtml = html + signatureBlock;
    return this.generatePdf(fullHtml, title);
  }

  hashDocument(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private wrapInDocument(html: string, title: string): string {
    return `<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(title)}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 100%;
    }
    h1 { font-size: 22px; text-align: center; margin-bottom: 24px; }
    h2 { font-size: 16px; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
    .variable-highlight { background: #fff3cd; padding: 2px 4px; border-radius: 2px; }
  </style>
</head>
<body>${html}</body>
</html>`;
  }

  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
