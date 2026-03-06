import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Érvényes email címet adj meg' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A jelszó legalább 8 karakter legyen' })
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;
}
