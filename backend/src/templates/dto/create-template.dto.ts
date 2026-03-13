import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateTemplateDto {
  @IsString() name: string;
  @IsString() category: string;
  @IsOptional() @IsString() description?: string;
  @IsString() contentHtml: string;
  @IsOptional() @IsArray() variables?: { name: string; label: string; type: string; required: boolean; filledBy?: 'creator' | 'signer'; signerIndex?: number }[];
  @IsOptional() @IsString() legalBasis?: string;
  @IsOptional() @IsString() contentHtmlEn?: string;
  @IsOptional() @IsString() changeNote?: string;
}
