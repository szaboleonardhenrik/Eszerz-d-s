import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, Matches } from 'class-validator';

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
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsBoolean({ message: 'Az ÁSZF és Adatvédelmi tájékoztató elfogadása kötelező' })
  acceptTerms: boolean;
}
