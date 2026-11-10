import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { normalizeEmail } from '../../common/transforms';

export class AuthDto {
  // Trim + lowercase supaya "Budi@Mail.com" sama dengan "budi@mail.com".
  @Transform(normalizeEmail)
  @IsEmail()
  @MaxLength(254)
  email!: string;

  // Tanpa MinLength di login (aturan itu milik register).
  // MaxLength 72 karena bcrypt hanya memproses 72 byte pertama.
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}
