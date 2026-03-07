import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Érvényes email címet adj meg' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A jelszó legalább 8 karakter legyen' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
    message: 'A jelszónak tartalmaznia kell kis- és nagybetűt, valamint számot',
  })
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
