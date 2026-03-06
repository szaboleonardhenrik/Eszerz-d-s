export class CreateQuoteItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  taxRate?: number;
}

export class CreateQuoteDto {
  title: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  validUntil?: string;
  currency?: string;
  notes?: string;
  items: CreateQuoteItemDto[];
}
