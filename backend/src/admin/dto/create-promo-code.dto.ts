import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreatePromoCodeDto {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  discountType: string;

  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsString()
  targetTier?: string;

  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
