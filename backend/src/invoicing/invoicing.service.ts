import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

interface InvoiceData {
  contractId: string;
  contractTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerTaxNumber?: string;
  amount?: number;
  currency?: string;
}

interface SzamlazzResponse {
  success: boolean;
  invoiceNumber?: string;
  pdfUrl?: string;
  error?: string;
}

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);
  private readonly agentKey: string;
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.agentKey = this.config.get<string>('SZAMLAZZ_AGENT_KEY', '');
    this.enabled = !!this.agentKey;
    if (!this.enabled) {
      this.logger.warn('Számlázz.hu integráció nincs konfigurálva (SZAMLAZZ_AGENT_KEY hiányzik)');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async createInvoiceForContract(data: InvoiceData): Promise<SzamlazzResponse> {
    if (!this.enabled) {
      return { success: false, error: 'Számlázz.hu nincs konfigurálva' };
    }

    // Build XML for Számlázz.hu Agent API
    const xml = this.buildInvoiceXml(data);

    try {
      const response = await fetch('https://www.szamlazz.hu/szamla/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xml,
      });

      const responseText = await response.text();

      if (response.ok && !responseText.includes('<hibakod>')) {
        // Extract invoice number from response
        const invoiceMatch = responseText.match(/<szamlaszam>(.*?)<\/szamlaszam>/);
        const pdfMatch = responseText.match(/<szamlapdf>(.*?)<\/szamlapdf>/);

        this.logger.log(`Számla kiállítva: ${invoiceMatch?.[1] ?? 'ismeretlen'} — szerződés: ${data.contractTitle}`);

        return {
          success: true,
          invoiceNumber: invoiceMatch?.[1],
          pdfUrl: pdfMatch?.[1],
        };
      } else {
        const errorMatch = responseText.match(/<hibaszoveg>(.*?)<\/hibaszoveg>/);
        this.logger.error(`Számlázz.hu hiba: ${errorMatch?.[1] ?? responseText}`);
        return { success: false, error: errorMatch?.[1] ?? 'Ismeretlen hiba' };
      }
    } catch (error) {
      this.logger.error('Számlázz.hu API hiba', error);
      return { success: false, error: 'Kapcsolódási hiba a Számlázz.hu-hoz' };
    }
  }

  private buildInvoiceXml(data: InvoiceData): string {
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const amount = data.amount ?? 0;
    const currency = data.currency ?? 'HUF';

    return `<?xml version="1.0" encoding="UTF-8"?>
<xmlszamla xmlns="http://www.szamlazz.hu/xmlszamla" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <beallitasok>
    <szamlaagentkulcs>${this.escapeXml(this.agentKey)}</szamlaagentkulcs>
    <eszamla>true</eszamla>
    <szamlaLetoltesFormat>0</szamlaLetoltesFormat>
  </beallitasok>
  <fejlec>
    <keltDatum>${today}</keltDatum>
    <teljesitesDatum>${today}</teljesitesDatum>
    <fizetesiHataridoDatum>${dueDate}</fizetesiHataridoDatum>
    <fizmod>Átutalás</fizmod>
    <ppienznem>${currency}</ppienznem>
    <szamlaNyelve>hu</szamlaNyelve>
    <megjegyzes>Szerződés: ${this.escapeXml(data.contractTitle)} (${this.escapeXml(data.contractId)})</megjegyzes>
  </fejlec>
  <elado />
  <vevo>
    <nev>${this.escapeXml(data.buyerName)}</nev>
    <email>${this.escapeXml(data.buyerEmail)}</email>
    ${data.buyerTaxNumber ? `<adoszam>${this.escapeXml(data.buyerTaxNumber)}</adoszam>` : ''}
  </vevo>
  <tetelek>
    <tetel>
      <megnevezes>Szerződés: ${this.escapeXml(data.contractTitle)}</megnevezes>
      <mennyiseg>1</mennyiseg>
      <mennyisegiEgyseg>db</mennyisegiEgyseg>
      <nettoEgysegar>${amount}</nettoEgysegar>
      <afakulcs>27</afakulcs>
      <nettoErtek>${amount}</nettoErtek>
      <afaErtek>${Math.round(amount * 0.27)}</afaErtek>
      <bruttoErtek>${Math.round(amount * 1.27)}</bruttoErtek>
    </tetel>
  </tetelek>
</xmlszamla>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async getInvoiceSettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return {
      enabled: this.enabled,
      autoInvoice: (user as any)?.autoInvoice ?? false,
    };
  }
}
