import { IsString, IsOptional, IsIn, IsNotEmpty } from 'class-validator';

export class SignContractDto {
  @IsIn(['simple', 'dap', 'microsec'])
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
}
