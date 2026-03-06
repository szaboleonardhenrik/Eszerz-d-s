import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Érvényes email címet adj meg' })
  email: string;

  @IsString()
  password: string;
}
