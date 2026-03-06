import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEmail,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SignerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  signingOrder?: number;
}

export class CreateContractDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  @IsOptional()
  variables?: Record<string, string>;

  @IsOptional()
  @IsString()
  contentHtml?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SignerDto)
  signers: SignerDto[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
