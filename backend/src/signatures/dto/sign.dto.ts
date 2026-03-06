import { IsString, IsOptional, IsIn } from 'class-validator';

export class SignContractDto {
  @IsIn(['simple', 'dap', 'microsec'])
  signatureMethod: string;

  @IsOptional()
  @IsString()
  signatureImageBase64?: string;

  @IsOptional()
  @IsString()
  typedName?: string;
}
