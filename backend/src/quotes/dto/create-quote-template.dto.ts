import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';

export class CreateQuoteTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  introText?: string;

  @IsOptional()
  @IsString()
  outroText?: string;

  @IsString()
  itemsJson: string;

  @IsOptional()
  @IsString()
  variables?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
