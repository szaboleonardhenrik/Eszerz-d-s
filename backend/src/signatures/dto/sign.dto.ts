import { IsString, IsOptional, IsIn, IsNotEmpty, IsBoolean, IsObject } from 'class-validator';

export class SignContractDto {
  // Only 'simple' is currently implemented. DAP and Microsec e-signature
  // provider integrations are planned but not yet available — accepting them
  // here without real cryptographic validation would be misleading and could
  // create a false sense of legal compliance.
  @IsIn(['simple'])
  signatureMethod: string;

  @IsOptional()
  @IsString()
  signatureImageBase64?: string;

  @IsOptional()
  @IsString()
  typedName?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  @IsNotEmpty({ message: 'Az aláíró teljes neve kötelező' })
  signerFullName: string;

  @IsString()
  @IsNotEmpty({ message: 'A vállalkozás neve kötelező' })
  companyName: string;

  @IsString()
  @IsNotEmpty({ message: 'A vállalkozás adószáma kötelező' })
  companyTaxNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'A vállalkozás székhelye kötelező' })
  companyAddress: string;

  @IsOptional()
  @IsBoolean()
  partnerConsent?: boolean;

  @IsOptional()
  @IsObject()
  signerVariables?: Record<string, string>;

  @IsBoolean({ message: 'Az adatkezelési hozzájárulás elfogadása kötelező' })
  dataConsent: boolean;
}
