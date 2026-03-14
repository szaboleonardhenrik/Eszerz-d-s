import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, Matches, IsIn } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Érvényes email címet adj meg' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'A jelszó legalább 8 karakter legyen' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
    message: 'A jelszónak tartalmaznia kell kis- és nagybetűt, számot, valamint speciális karaktert',
  })
  password: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsIn(['personal', 'company'], { message: 'Érvénytelen fiók típus' })
  accountType?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @Matches(/^\d{8}-\d{1,2}-\d{2}$/, { message: 'Érvénytelen adószám formátum (helyes: 12345678-1-23)' })
  taxNumber?: string;

  @IsOptional()
  @IsString()
  companyAddress?: string;

  @IsBoolean({ message: 'Az ÁSZF és Adatvédelmi tájékoztató elfogadása kötelező' })
  acceptTerms: boolean;
}
