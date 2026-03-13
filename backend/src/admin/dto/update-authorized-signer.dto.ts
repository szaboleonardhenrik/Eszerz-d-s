import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAuthorizedSignerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  companyTaxNumber?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
