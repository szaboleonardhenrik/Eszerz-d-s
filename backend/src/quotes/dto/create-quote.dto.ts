import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuoteItemDto {
  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsString()
  sectionName?: string;

  @IsOptional()
  @IsBoolean()
  isOptional?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  discountType?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateQuoteDto {
  @IsString()
  title: string;

  @IsString()
  clientName: string;

  @IsEmail()
  clientEmail: string;

  @IsOptional()
  @IsString()
  clientCompany?: string;

  @IsOptional()
  @IsString()
  clientPhone?: string;

  @IsOptional()
  @IsString()
  clientAddress?: string;

  @IsOptional()
  @IsString()
  clientTaxNumber?: string;

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  introText?: string;

  @IsOptional()
  @IsString()
  outroText?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsString()
  discountType?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  variablesData?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuoteItemDto)
  items: CreateQuoteItemDto[];
}
