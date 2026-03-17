import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export type InvoicingProvider = 'billingo' | 'szamlazzhu';

export interface InvoiceData {
  contractId?: string;
  contractTitle: string;
  buyerName: string;
  buyerEmail: string;
  buyerTaxNumber?: string;
  amount?: number;
  currency?: string;
}

interface ProviderResponse {
  success: boolean;
  invoiceNumber?: string;
  externalId?: string;
  pdfUrl?: string;
  error?: string;
}

@Injectable()
export class InvoicingService {
  private readonly logger = new Logger(InvoicingService.name);
  private readonly provider: InvoicingProvider | null;
  private readonly szamlazzAgentKey: string;
  private readonly billingoApiKey: string;
  private readonly enabled: boolean;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const providerEnv = this.config.get<string>('INVOICING_PROVIDER', '');
    this.szamlazzAgentKey = this.config.get<string>('SZAMLAZZHU_AGENT_KEY', '') || this.config.get<string>('SZAMLAZZ_AGENT_KEY', '');
    this.billingoApiKey = this.config.get<string>('BILLINGO_API_KEY', '');

    if (providerEnv === 'billingo' && this.billingoApiKey) {
      this.provider = 'billingo';
      this.enabled = true;
    } else if ((providerEnv === 'szamlazzhu' || !providerEnv) && this.szamlazzAgentKey) {
      this.provider = 'szamlazzhu';
      this.enabled = true;
    } else {
      this.provider = null;
      this.enabled = false;
      this.logger.warn('Invoicing disabled — no INVOICING_PROVIDER / API key configured');
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getProvider(): InvoicingProvider | null {
    return this.provider;
  }

  // ─── CREATE FROM CONTRACT ─────────────────────────────
  async createFromContract(userId: string, contractId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        owner: { select: { id: true, name: true, email: true, companyName: true, taxNumber: true } },
        signers: { select: { name: true, email: true, companyName: true, companyTaxNumber: true } },
      },
    });

    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.ownerId !== userId) throw new ForbiddenException();

    // Use first signer as buyer if available
    const buyer = contract.signers[0];
    const buyerName = buyer?.companyName || buyer?.name || 'N/A';
    const buyerEmail = buyer?.email || '';
    const buyerTaxNumber = buyer?.companyTaxNumber || undefined;

    // Parse amount from variables if available
    let amount = 0;
    if (contract.variablesData) {
      try {
        const vars = JSON.parse(contract.variablesData);
        const amountField = vars.osszeg || vars.amount || vars.dij || vars.ar || vars.price;
        if (amountField) amount = parseFloat(String(amountField).replace(/[^\d.-]/g, '')) || 0;
      } catch {}
    }

    const data: InvoiceData = {
      contractId: contract.id,
      contractTitle: contract.title,
      buyerName,
      buyerEmail,
      buyerTaxNumber,
      amount,
      currency: 'HUF',
    };

    if (!this.enabled || !this.provider) {
      // Create draft invoice record even if provider not configured
      const invoice = await this.prisma.invoice.create({
        data: {
          userId,
          contractId,
          provider: 'szamlazzhu',
          partnerName: buyerName,
          partnerEmail: buyerEmail,
          buyerName,
          buyerEmail,
          buyerTaxNumber,
          amount,
          currency: 'HUF',
          status: 'draft',
        },
      });
      return { invoice, providerEnabled: false };
    }

    // Call provider
    const result = this.provider === 'billingo'
      ? await this.createViaBillingo(data)
      : await this.createViaSzamlazz(data);

    const now = new Date();
    const dueDate = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);

    const invoice = await this.prisma.invoice.create({
      data: {
        userId,
        contractId,
        provider: this.provider,
        externalId: result.externalId,
        invoiceNumber: result.invoiceNumber,
        partnerName: buyerName,
        partnerEmail: buyerEmail,
        buyerName,
        buyerEmail,
        buyerTaxNumber,
        amount,
        currency: 'HUF',
        status: result.success ? 'issued' : 'failed',
        issuedAt: result.success ? now : null,
        dueAt: result.success ? dueDate : null,
        pdfUrl: result.pdfUrl,
        errorMessage: result.error,
      },
    });

    return { invoice, success: result.success, error: result.error };
  }

  // ─── BILLINGO API v3 ──────────────────────────────────
  private async createViaBillingo(data: InvoiceData): Promise<ProviderResponse> {
    try {
      const amount = data.amount ?? 0;
      const currency = data.currency ?? 'HUF';

      // Step 1: Create or find partner
      const partnerRes = await fetch('https://api.billingo.hu/v3/partners', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.billingoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.buyerName,
          emails: data.buyerEmail ? [data.buyerEmail] : [],
          taxcode: data.buyerTaxNumber || '',
        }),
      });

      let partnerId: number;
      if (partnerRes.ok) {
        const partnerData = await partnerRes.json();
        partnerId = partnerData.id;
      } else {
        const errText = await partnerRes.text();
        this.logger.error(`Billingo partner create failed: ${errText}`);
        return { success: false, error: `Partner creation failed: ${errText}` };
      }

      // Step 2: Create invoice
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const invoiceRes = await fetch('https://api.billingo.hu/v3/documents', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.billingoApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partner_id: partnerId,
          block_id: 0, // default block
          type: 'invoice',
          fulfillment_date: today,
          due_date: dueDate,
          payment_method: 'wire_transfer',
          language: 'hu',
          currency,
          electronic: true,
          items: [
            {
              name: `Szerzodes: ${data.contractTitle}`,
              unit_price: amount,
              unit_price_type: 'net',
              quantity: 1,
              unit: 'db',
              vat: '27%',
              comment: data.contractId ? `Contract ID: ${data.contractId}` : '',
            },
          ],
        }),
      });

      if (invoiceRes.ok) {
        const invoiceData = await invoiceRes.json();
        this.logger.log(`Billingo invoice created: ${invoiceData.invoice_number ?? invoiceData.id}`);
        return {
          success: true,
          invoiceNumber: invoiceData.invoice_number,
          externalId: String(invoiceData.id),
          pdfUrl: invoiceData.pdf_url,
        };
      } else {
        const errText = await invoiceRes.text();
        this.logger.error(`Billingo invoice create failed: ${errText}`);
        return { success: false, error: errText };
      }
    } catch (error: any) {
      this.logger.error('Billingo API error', error);
      return { success: false, error: `Billingo connection error: ${error.message}` };
    }
  }

  // ─── SZAMLAZZ.HU ─────────────────────────────────────
  private async createViaSzamlazz(data: InvoiceData): Promise<ProviderResponse> {
    const xml = this.buildInvoiceXml(data);

    try {
      const response = await fetch('https://www.szamlazz.hu/szamla/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/xml' },
        body: xml,
      });

      const responseText = await response.text();

      if (response.ok && !responseText.includes('<hibakod>')) {
        const invoiceMatch = responseText.match(/<szamlaszam>(.*?)<\/szamlaszam>/);
        const pdfMatch = responseText.match(/<szamlapdf>(.*?)<\/szamlapdf>/);

        this.logger.log(`Szamlazz.hu invoice issued: ${invoiceMatch?.[1] ?? 'unknown'} — ${data.contractTitle}`);

        return {
          success: true,
          invoiceNumber: invoiceMatch?.[1],
          pdfUrl: pdfMatch?.[1],
        };
      } else {
        const errorMatch = responseText.match(/<hibaszoveg>(.*?)<\/hibaszoveg>/);
        this.logger.error(`Szamlazz.hu error: ${errorMatch?.[1] ?? responseText}`);
        return { success: false, error: errorMatch?.[1] ?? 'Unknown error' };
      }
    } catch (error: any) {
      this.logger.error('Szamlazz.hu API error', error);
      return { success: false, error: 'Connection error to Szamlazz.hu' };
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
    <szamlaagentkulcs>${this.escapeXml(this.szamlazzAgentKey)}</szamlaagentkulcs>
    <eszamla>true</eszamla>
    <szamlaLetoltesFormat>0</szamlaLetoltesFormat>
  </beallitasok>
  <fejlec>
    <keltDatum>${today}</keltDatum>
    <teljesitesDatum>${today}</teljesitesDatum>
    <fizetesiHataridoDatum>${dueDate}</fizetesiHataridoDatum>
    <fizmod>Atutalas</fizmod>
    <ppienznem>${currency}</ppienznem>
    <szamlaNyelve>hu</szamlaNyelve>
    <megjegyzes>Szerzodes: ${this.escapeXml(data.contractTitle)}${data.contractId ? ` (${this.escapeXml(data.contractId)})` : ''}</megjegyzes>
  </fejlec>
  <elado />
  <vevo>
    <nev>${this.escapeXml(data.buyerName)}</nev>
    <email>${this.escapeXml(data.buyerEmail)}</email>
    ${data.buyerTaxNumber ? `<adoszam>${this.escapeXml(data.buyerTaxNumber)}</adoszam>` : ''}
  </vevo>
  <tetelek>
    <tetel>
      <megnevezes>Szerzodes: ${this.escapeXml(data.contractTitle)}</megnevezes>
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

  // ─── SETTINGS ────────────────────────────────────────

  async getInvoiceSettings(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return {
      enabled: this.enabled,
      provider: this.provider,
      autoInvoice: (user as any)?.autoInvoice ?? false,
    };
  }

  async updateInvoiceSettings(userId: string, autoInvoice: boolean) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { autoInvoice },
    });
    return { autoInvoice };
  }

  // ─── INVOICE LIST ────────────────────────────────────

  async listInvoices(userId: string, page: number, limit: number) {
    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          contract: { select: { id: true, title: true } },
        },
      }),
      this.prisma.invoice.count({ where: { userId } }),
    ]);

    return {
      invoices,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  // ─── INVOICE PDF DOWNLOAD ───────────────────────────

  async getInvoicePdf(userId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.userId !== userId) throw new ForbiddenException();

    if (invoice.pdfUrl) {
      return { pdfUrl: invoice.pdfUrl };
    }

    // Try to fetch from provider
    if (invoice.provider === 'billingo' && invoice.externalId && this.billingoApiKey) {
      try {
        const res = await fetch(`https://api.billingo.hu/v3/documents/${invoice.externalId}/download`, {
          headers: { 'X-API-KEY': this.billingoApiKey },
        });
        if (res.ok) {
          const data = await res.json();
          return { pdfUrl: data.url || data.pdf_url };
        }
      } catch {}
    }

    throw new NotFoundException('Invoice PDF not available');
  }

  // ─── RETRY FAILED INVOICE ───────────────────────────

  async retryInvoice(userId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.userId !== userId) throw new ForbiddenException();
    if (invoice.status !== 'failed') throw new BadRequestException('Only failed invoices can be retried');

    const data: InvoiceData = {
      contractId: invoice.contractId ?? invoice.quoteId ?? '',
      contractTitle: `Retry — ${invoice.buyerName}`,
      buyerName: invoice.buyerName,
      buyerEmail: invoice.buyerEmail,
      buyerTaxNumber: invoice.buyerTaxNumber ?? undefined,
      amount: invoice.amount,
      currency: invoice.currency,
    };

    const result = this.provider === 'billingo'
      ? await this.createViaBillingo(data)
      : await this.createViaSzamlazz(data);

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: result.success
        ? {
            status: 'issued',
            invoiceNumber: result.invoiceNumber,
            externalId: result.externalId,
            pdfUrl: result.pdfUrl,
            errorMessage: null,
            issuedAt: new Date(),
          }
        : { errorMessage: result.error },
    });

    return { success: result.success, invoiceNumber: result.invoiceNumber, error: result.error };
  }

  // ─── LEGACY COMPAT ───────────────────────────────────
  async createInvoiceForContract(data: InvoiceData): Promise<ProviderResponse> {
    if (!this.enabled) {
      return { success: false, error: 'Invoicing not configured' };
    }
    return this.provider === 'billingo'
      ? this.createViaBillingo(data)
      : this.createViaSzamlazz(data);
  }
}
