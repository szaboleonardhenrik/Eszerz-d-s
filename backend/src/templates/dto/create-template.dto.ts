import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateTemplateDto {
  @IsString() name: string;
  @IsString() category: string;
  @IsOptional() @IsString() description?: string;
  @IsString() contentHtml: string;
  @IsOptional() @IsArray() variables?: { name: string; label: string; type: string; required: boolean }[];
  @IsOptional() @IsString() legalBasis?: string;
}
