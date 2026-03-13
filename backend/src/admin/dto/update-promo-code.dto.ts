import { IsOptional, IsBoolean, IsNumber, IsDateString } from 'class-validator';

export class UpdatePromoCodeDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
